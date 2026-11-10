# Site mira — mode d'emploi

```
mira/
├── site/      le site : pages, styles, scripts, images, polices, vidéos
├── server/    le serveur : connexion, agenda, espaces équipe et client, base de données
├── outils/    préparation des vidéos (+ dossier où déposer les vidéos brutes)
├── index.html          double-clic : ouvre la vitrine (aperçu)
├── lancer-le-site.bat  double-clic : lance le site complet (Windows)
└── README.md           ce mode d'emploi
```

## 1. Voir le site

**Aperçu rapide** : double-cliquez sur `index.html`. La vitrine s'affiche comme en ligne, avec les contenus de démonstration. L'agenda est en aperçu : la réservation, la connexion et les formulaires demandent le serveur.

**Site complet** (réservation, formulaires, espaces équipe et client) — prérequis : [Node.js](https://nodejs.org) 20 ou plus. Sous Windows, double-cliquez sur `lancer-le-site.bat` : il installe ce qu'il faut la première fois, démarre le serveur et ouvre le navigateur (fermez sa fenêtre pour arrêter le site). Ou, dans un terminal :

```bash
cd server
npm install
npm start
```

Ouvrez ensuite **http://localhost:3000**.

Au premier lancement, une base de démonstration est créée et les mots de passe des deux comptes de test s'affichent dans le terminal (vous pouvez les imposer dans `server/.env` avec `SEED_ADMIN_PASSWORD` et `SEED_CLIENT_PASSWORD`). Pour changer un mot de passe : `npm run password -- adresse@email.fr "nouveau-mot-de-passe"` (12 caractères minimum).

En local (localhost ou double-clic), des contenus de **démonstration** (marqués « DÉMO ») remplissent les réalisations, l'avant/après, les logos, les résultats et les témoignages. Ils ne s'affichent **jamais** en ligne.

> npm 11 et plus : si un avertissement « install-scripts » cite better-sqlite3, lancez `npm install-scripts approve better-sqlite3` puis `npm rebuild better-sqlite3`.

## 2. Ajouter une réalisation vidéo

1. Déposez le fichier brut (MP4 ou MOV) dans `outils/videos-brutes/`.
2. Dans le dossier `server`, lancez `npm run videos`. Il faut ffmpeg ; sous Windows : `winget install ffmpeg`.
3. Le script crée la vidéo compressée, un aperçu de 6 secondes et une image d'attente dans `site/videos/`, puis affiche une ligne.
4. Collez cette ligne dans `site/assets/data/realisations.js`, puis remplacez le nom du lieu, la ville et le format (`Fragments`, `Mirage` ou `TikTok Trend`).

Un fichier `site/videos/showreel.mp4` remplace automatiquement les photos d'ambiance sous l'accroche.

## 3. Ajouter un autre contenu

Chaque fichier contient en tête une notice et le format attendu.

| Contenu | Fichier | Remarque |
|---|---|---|
| Logo client | `site/assets/data/clients.js` | Logo à placer dans `site/assets/img/clients/`. La section n'apparaît qu'à partir de 4 logos. |
| Témoignage vidéo | `site/assets/data/temoignages.js` | Même procédure que pour les vidéos. |
| Avis écrit | `site/index.html`, section `#temoignages` | Copiez un modèle `review-card` en dehors du commentaire. Uniquement de vrais avis, avec l'accord du client. |
| Résultat avant / après | `site/assets/data/resultats.js` (abonnés) et `site/assets/data/avantApres.js` (étalonnage) | — |

Une liste vide fait disparaître la section concernée et son lien. **Ne publiez jamais de faux contenu** : c'est une pratique commerciale trompeuse (Code de la consommation, art. L121-2).

## 4. Agenda de réservation

Les visiteurs choisissent un jour et une heure directement sur le site : dans la section Contact et dans la fenêtre « Réserver un appel ». Le rendez-vous est enregistré, le créneau disparaît de l'agenda, et l'appel apparaît dans l'**espace équipe**, rubrique « Appels réservés », d'où vous pouvez l'annuler (le créneau redevient libre) ou le supprimer.

Vos horaires se règlent dans `server/disponibilites.js` : jours et plages ouvertes, durée de l'appel, délai minimum, nombre de jours réservables, jours fermés (congés, fériés). Redémarrez le serveur après modification.

Aucune notification n'est envoyée : consultez l'espace équipe pour voir les nouveaux rendez-vous.

## 5. Espace équipe et espace client

Connectez-vous sur http://localhost:3000/connexion.html avec un compte équipe.

- **Convertir un prospect** : sur un appel réservé ou une demande reçue, cliquez sur « Convertir en client ». Ses informations sont reprises, un compte et (si vous le nommez) un premier projet sont créés. Le mot de passe s'affiche une seule fois, avec un message prêt à copier pour le client.
- **Clients** : modifier, générer un nouveau mot de passe, ajouter un projet, ou supprimer (compte, projets et tableau de bord effacés, accès coupé immédiatement).
- **Projets** : « Gérer » ouvre la page du projet. Vous y remplissez :
  - les infos, les étapes et les nouvelles (activité) ;
  - les **contenus** : programmés, *à valider par le client*, publiés ou livrés, avec lien et chiffres ;
  - les **statistiques des réseaux**, un relevé par mois et par réseau (abonnés, comptes touchés, vues, interactions) ;
  - la **publicité** : budget, dépense et résultats de chaque campagne.

  « Voir comme le client » montre exactement son tableau de bord.
- **Côté client** : il voit ses chiffres clés, l'évolution de ses réseaux, ses contenus, ses dépenses publicitaires et l'avancement. Il **valide** les contenus ou **demande une modification** ; vous le voyez dans l'activité du projet.

Les statistiques sont saisies à la main à partir des statistiques Instagram et TikTok (une fois par mois suffit).

## 6. Coordonnées et mentions légales

Tout se trouve dans `site/assets/js/config.js`. Les mêmes valeurs sont aussi écrites dans les pages HTML, repérées par le commentaire `<!-- SYNC config.js -->` : modifiez les deux.

- Toute valeur `TODO_…` reste à compléter (SIRET, nom, adresse, hébergeur…).
- Pour utiliser Cal.com ou Calendly à la place de l'agenda du site : `booking.provider` et `booking.lien` dans `config.js`, et `BOOKING_PROVIDER` dans `server/.env`.
- Registre des traitements RGPD : `server/REGISTRE-RGPD.md`.

## 7. Mettre en ligne

1. Choisissez un hébergeur Node.js **avec disque persistant**, par exemple Railway avec un Volume monté sur `/data`.
2. Dans les variables d'environnement, définissez :
   - `NODE_ENV=production` ;
   - `SESSION_SECRET` : une longue chaîne aléatoire, à générer avec `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` ;
   - `DB_PATH=/data/mira.db` (comptes, projets, tableaux de bord, demandes et rendez-vous y sont enregistrés).
3. Commande de démarrage : `cd server && npm install && npm start`.
4. Activez le **HTTPS** et branchez votre domaine. Remplacez ensuite `https://mira.agency` dans `config.js`, `index.html`, `sitemap.xml` et `robots.txt` s'il diffère.
5. ⚠ Un hébergement **gratuit sans disque persistant efface la base** (comptes, projets, demandes) à chaque déploiement.

En production, le serveur refuse de démarrer sans `SESSION_SECRET` solide et ne crée jamais de comptes de démonstration.

Les fichiers CSS et JS sont revérifiés à chaque visite : une mise à jour est visible immédiatement. Les images, polices et vidéos restent en cache.

## Sécurité (résumé)

Mots de passe hachés (bcrypt), session dans un cookie httpOnly régénérée à chaque connexion, rôles vérifiés côté serveur (un client ne voit que ses projets), limitation des tentatives et des envois, anti-CSRF, en-têtes de sécurité (CSP, anti-iframe, HSTS en production). Seul le dossier `site/` est servi, et seulement les pages prévues : le dossier `server/` (base, `.env`, code) n'est jamais accessible depuis le web.
