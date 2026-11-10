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

## 4. Agenda de réservation

Les visiteurs choisissent un jour et une heure directement sur le site : dans la section Contact et dans la fenêtre « Réserver un appel ». Le rendez-vous est enregistré, le créneau disparaît de l'agenda, et l'appel apparaît dans l'**espace équipe**, rubrique « Appels réservés », d'où vous pouvez l'annuler (le créneau redevient libre) ou le supprimer.

Vos horaires se règlent dans `server/disponibilites.js` : jours et plages ouvertes, durée de l'appel, délai minimum, nombre de jours réservables, jours fermés (congés, fériés). Redémarrez le serveur après modification.

Aucune notification n'est envoyée : consultez l'espace équipe pour voir les nouveaux rendez-vous.

## 5. Espace équipe et espace client

Connectez-vous sur `/connexion.html` avec un compte équipe.

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

Tout se trouve dans `assets/js/config.js`. Les mêmes valeurs sont aussi écrites dans les pages HTML, repérées par le commentaire `<!-- SYNC config.js -->` : modifiez les deux.

- Toute valeur `TODO_…` reste à compléter (SIRET, nom, adresse, hébergeur…).
- Pour utiliser Cal.com ou Calendly à la place de l'agenda du site : `booking.provider` et `booking.lien` dans `config.js`, et `BOOKING_PROVIDER` dans `server/.env`.

## 7. Mettre en ligne

1. Choisissez un hébergeur Node.js **avec disque persistant**, par exemple Railway avec un Volume monté sur `/data`.
2. Dans les variables d'environnement, définissez :
   - `NODE_ENV=production` ;
   - `SESSION_SECRET` : une longue chaîne aléatoire, à générer avec `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` ;
   - `DB_PATH=/data/mira.db` (comptes, projets, tableaux de bord, demandes et rendez-vous y sont enregistrés).
3. Commande de démarrage : `cd server && npm install && npm start`.
4. Activez le **HTTPS** et branchez votre domaine. Remplacez ensuite `https://mira.agency` dans `config.js`, `index.html`, `sitemap.xml` et `robots.txt` s'il diffère.
5. ⚠ Un hébergement **gratuit sans disque persistant efface la base** (comptes, projets, demandes) à chaque déploiement.

Les fichiers CSS et JS sont mis en cache 7 jours. Après une mise à jour, demandez aux visiteurs réguliers de recharger la page, ou ajoutez `?v=2` aux liens dans les pages HTML.
