# Espace mira — back-end d'authentification

Serveur **Node.js / Express** qui gère la connexion (email + mot de passe haché),
les sessions, les rôles (équipe / client) et le suivi de projet. Il sert aussi
les pages du site (`index.html`, `connexion.html`, etc.).

## Prérequis
- **Node.js 18 ou plus** ([nodejs.org](https://nodejs.org))

## Installation (une seule fois)

Dans un terminal, placez-vous dans le dossier `server/` puis :

```bash
npm install        # installe les dépendances
# npm 11+ : si un avertissement « install-scripts » cite better-sqlite3,
# lancez « npm install-scripts approve better-sqlite3 » puis « npm rebuild better-sqlite3 »
# (son module natif doit être compilé pour votre version de Node).
cp .env.example .env   # (Windows PowerShell : copy .env.example .env)
npm run seed       # crée la base + les comptes de départ
```

`npm run seed` crée deux comptes et **affiche leurs mots de passe une seule fois**
(générés aléatoirement — notez-les). Vous pouvez aussi les imposer dans `.env`
avec `SEED_ADMIN_PASSWORD` et `SEED_CLIENT_PASSWORD`.

| Rôle   | Email                       | Accès                          |
|--------|-----------------------------|--------------------------------|
| Équipe | mehdipelardy@gmail.com      | Tableau de bord (tous projets) |
| Client | client@atelier-voltz.com    | Suivi du projet MIRA-2026-014  |

Changer un mot de passe (12 caractères minimum, déconnecte toutes les sessions) :

```bash
npm run password -- mehdipelardy@gmail.com "un-mot-de-passe-long"
```

## Démarrer le serveur

```bash
npm start
```

Puis ouvrez **http://localhost:3000**.

- `index.html` → vitrine ; « Réserver un appel » ouvre l'agenda (modale), « Être rappelé » → `rendez-vous.html`.
- Footer → « Connexion » → `connexion.html`.
- Onglet **Équipe** → tableau de bord interne.
- Onglet **Client** → suivi de son projet.

> Important : ouvrez le site **via http://localhost:3000** (servi par Node), et non en
> double-cliquant les fichiers `.html`. Les appels d'authentification (`/api/...`)
> ne fonctionnent que servis par le serveur.

## Comment ça protège l'accès
- Mots de passe **hachés avec bcrypt** — jamais stockés en clair.
- Session signée dans un **cookie httpOnly** (illisible par le JavaScript de page).
- Les rôles sont vérifiés **côté serveur** : un client ne peut consulter que **son**
  projet ; le tableau de bord équipe est refusé à un compte client (HTTP 403),
  et la page `espace-equipe.html` redirige vers la connexion si la session n'est pas « équipe ».
- Session **régénérée à chaque connexion** (anti fixation de session).
- **Limitation des tentatives** : 10 connexions / 15 min et 5 demandes de RDV / heure par IP.
- **Anti-CSRF** : les appels POST doivent être en JSON et venir du site lui-même.
- **En-têtes de sécurité** : Content-Security-Policy, anti-iframe (clickjacking),
  `nosniff`, `Referrer-Policy`, HSTS en production.
- **Liste blanche des pages** : seules les pages publiques sont servies. Le dossier
  `server/` (base de données, `.env`, code) n'est jamais accessible depuis le web.
- En production, le serveur **refuse de démarrer** sans `SESSION_SECRET` solide et
  ne crée **jamais** de comptes de démonstration automatiquement.

## Demandes de rendez-vous
Le formulaire « Être rappelé » (`rendez-vous.html`) enregistre les demandes dans la base
(table `requests`). Elles apparaissent dans l'**espace équipe**, section « Demandes reçues ».

## Gérer les comptes et projets
Les données sont dans la base SQLite `server/mira.db` (ou au chemin défini par `DB_PATH` dans `.env`).
- Ajouter un client / un projet : adaptez `seed.js` puis relancez `npm run seed`
  *(attention : `seed.js` remet les données à zéro)*, ou insérez directement en base.
- Pour de l'ajout sans reset, on pourra créer des routes d'administration
  (création de compte client, mise à jour d'avancement) — dites-le-moi.

## Mise en production (résumé)
1. Hébergez sur un serveur Node (votre VPS, Render, Railway, etc.).
2. Mettez un `SESSION_SECRET` long et aléatoire dans `.env`.
3. Passez `NODE_ENV=production` et servez en **HTTPS** (active le cookie sécurisé).
4. **Base de données persistante** : réglez `DB_PATH` vers un disque qui survit aux déploiements
   (ex. volume Railway monté sur `/data` → `DB_PATH=/data/mira.db`). Sans disque persistant,
   la base — comptes, projets, demandes — est effacée à chaque déploiement.
5. Si l'agenda passe de Cal.com à Calendly, réglez `BOOKING_PROVIDER=calendly` (domaines autorisés dans la CSP).

## RGPD
- **Aucun service tiers au chargement des pages** : polices hébergées dans `/fonts`, CSP qui
  n'autorise que l'agenda de prise de RDV (Cal.com : `app.cal.com`, `cal.com`).
  Cet agenda n'est chargé que lorsque le visiteur clique sur « Réserver un appel ».
  Pas de cookie publicitaire ni de mesure d'audience, donc pas de bandeau cookies nécessaire.
- **Cal.com** est sous-traitant pour la prise de RDV en ligne (nom, e-mail, téléphone, réponses) :
  à déclarer dans le registre et à encadrer par son DPA.
- **Consentement** obligatoire dans le formulaire, horodaté (`requests.consent_at`).
- **Conservation** : les demandes de plus de 3 ans sont supprimées automatiquement.
- **Droit à l'effacement** : bouton « Supprimer » sur chaque demande dans l'espace équipe.
- **Registre des traitements** et procédures (accès, effacement, fuite de données) :
  voir [REGISTRE-RGPD.md](REGISTRE-RGPD.md) — document interne, à compléter.
