# Site mira — mode d'emploi

Vitrine (`index.html`), formulaire « Être rappelé », espace client, espace équipe et serveur (dossier `server/`).

## 1. Lancer le site sur votre ordinateur

Prérequis : [Node.js](https://nodejs.org) 20 ou plus.

```bash
cd server
npm install
npm start
```

Ouvrez ensuite **http://localhost:3000**. Il faut toujours passer par cette adresse : un double-clic sur un fichier `.html` ne fonctionne pas.

En local, des contenus de **démonstration** (marqués « DÉMO ») remplissent les réalisations, l'avant/après, les logos, les résultats et les témoignages. Ils ne s'affichent **jamais** en ligne.

## 2. Ajouter une réalisation vidéo

1. Déposez le fichier brut (MP4 ou MOV) dans `brief/videos/`.
2. À la racine du projet, lancez `npm run videos`. Il faut ffmpeg ; sous Windows, installez-le avec `winget install ffmpeg`.
3. Le script crée la vidéo compressée, un aperçu de 6 secondes et une image d'attente dans `videos/`, puis affiche une ligne.
4. Collez cette ligne dans `assets/data/realisations.js`, puis remplacez le nom du lieu, la ville et le format (`Fragments`, `Mirage` ou `TikTok Trend`).

Un fichier nommé `showreel.mp4` remplace automatiquement les photos d'ambiance sous l'accroche.

## 3. Ajouter un autre contenu

Chaque fichier contient en tête une notice et le format attendu.

| Contenu | Fichier | Remarque |
|---|---|---|
| Logo client | `assets/data/clients.js` | Logo à placer dans `assets/img/clients/`. La section n'apparaît qu'à partir de 4 logos. |
| Témoignage vidéo | `assets/data/temoignages.js` | Même procédure que pour les vidéos. |
| Avis écrit | `index.html`, section `#temoignages` | Copiez un modèle `review-card` en dehors du commentaire. Uniquement de vrais avis, avec l'accord du client. |
| Résultat avant / après | `assets/data/resultats.js` (abonnés) et `assets/data/avantApres.js` (étalonnage) | — |

Une liste vide fait disparaître la section concernée et son lien. **Ne publiez jamais de faux contenu** : c'est une pratique commerciale trompeuse (Code de la consommation, art. L121-2).

## 4. Coordonnées, lien de réservation, mentions légales

Tout se trouve dans `assets/js/config.js`. Les mêmes valeurs sont aussi écrites dans les pages HTML, repérées par le commentaire `<!-- SYNC config.js -->` : modifiez les deux.

- **Lien Cal.com** : `booking.lien`, par exemple `"votre-nom/20min"`. Tant qu'il vaut `TODO_LIEN_CAL`, la fenêtre de réservation propose le téléphone, WhatsApp et le formulaire de rappel.
- **Passer à Calendly** : `booking.provider: "calendly"`, l'URL Calendly dans `lien`, et `BOOKING_PROVIDER=calendly` dans `server/.env`.
- Toute valeur `TODO_…` reste à compléter (SIRET, nom, adresse, hébergeur…).

## 5. Mettre en ligne

1. Choisissez un hébergeur Node.js **avec disque persistant**, par exemple Railway avec un Volume monté sur `/data`.
2. Dans les variables d'environnement, définissez :
   - `NODE_ENV=production` ;
   - `SESSION_SECRET` : une longue chaîne aléatoire, à générer avec `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` ;
   - `DB_PATH=/data/mira.db`.
3. Commande de démarrage : `cd server && npm install && npm start`.
4. Activez le **HTTPS** et branchez votre domaine. Remplacez ensuite `https://mira.agency` dans `config.js`, `index.html`, `sitemap.xml` et `robots.txt` s'il diffère.
5. ⚠ Un hébergement **gratuit sans disque persistant efface la base** (comptes, projets, demandes) à chaque déploiement.

Les fichiers CSS et JS sont mis en cache 7 jours. Après une mise à jour, demandez aux visiteurs réguliers de recharger la page, ou ajoutez `?v=2` aux liens dans les pages HTML.
