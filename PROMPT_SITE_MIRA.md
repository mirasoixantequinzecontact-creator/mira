# MISSION — Refonte de la vitrine Mira, sur le site existant

Tu travailles dans le dossier `mira/`, qui contient **un site qui fonctionne déjà** : une vitrine (`index.html`), un formulaire de rappel, un espace client, un espace équipe et un serveur Express + SQLite. Tu appliques **les modifications précises listées ci-dessous**, fichier par fichier. Tu ne réécris pas ce qui n'est pas listé.

Règles :
- Tu ne t'arrêtes pas pour poser des questions. Quand une info manque, tu mets une valeur `TODO_...` dans `assets/js/config.js` et tu continues.
- **Rien ne doit casser** : connexion équipe, connexion client, suivi de projet, formulaire de rappel, liste des demandes dans l'espace équipe.
- **Objectif unique de la vitrine : faire réserver un appel de 20 min.** Aucun prix affiché : le tarif est fixé sur devis après l'appel.
- **Zéro faux contenu** : pas de faux logos, de faux avis, de faux chiffres ni de fausses vidéos (Code de la consommation, art. L121-2 et suivants). Une section sans contenu réel n'est pas affichée.

---

## 0. Filet de sécurité (avant toute modification)

1. Il n'y a pas de dépôt git. Fais `git init` avec un `.gitignore` racine qui contient : `node_modules/`, `server/node_modules/`, `server/.env`, `server/mira.db`, `server/mira.db-shm`, `server/mira.db-wal`, `brief/videos/*` et `!brief/videos/LISEZMOI.txt`.
2. Vérifie avec `git status` qu'aucun secret ni base de données n'est suivi, puis commit : `état avant refonte`.
3. Crée la branche `refonte-vitrine` et travailles-y. Un commit par étape numérotée ci-dessous.
4. Lance le serveur (`cd server && npm install && npm start`). Connecte-toi en équipe puis en client (identifiants : voir `server/README.md` ; si tu ne les as pas, utilise `npm run password` en local). Fais des captures Playwright de **toutes** les pages actuelles à 390×844 et 1440×900 dans `brief/captures-avant/` pour comparer à la fin.

---

## 1. Kit fourni dans `brief/`

- `brief/Fiche_Offres_Mira_Agency.html` → **la brochure, référence de DA et de contenu** (packs, méthode, bénéfices, ton). Lis-la en entier.
- `brief/assets/web/` → **assets déjà prêts pour le web** : déplace-les dans `assets/img/` (les éléments de marque dans `assets/img/brand/`) :
  - `wordmark-mira.svg` → **« mira . » vectorisé** (`fill="currentColor"`) : header, footer géant, modale. À privilégier sur les PNG.
  - `m-italique.svg` → **le « m » italique seul**, vectorisé (`currentColor`) : signature de marque (§4.1)
  - `favicon.svg` → favicon vectoriel (m noir sur fond blanc)
  - `oeil-noir|blanc.(png|webp)` et `oeil-noir|blanc@2x.(png|webp)` → **l'œil** extrait du logo (235×211 px, version @2x à 470×422). Matière bitmap granuleuse : voir les tailles max au §4.1.
  - `wordmark-mira-noir|blanc.(png|webp)` → fallback bitmap du wordmark
  - `logo-mira-noir|blanc.(png|webp)` → logo complet (mira . + mira.agency + m œil)
  - `monogramme-m-noir|blanc.(png|webp)` → bloc « m + œil + by mira.soixantequinze »
  - `favicon.ico`, `apple-touch-icon.png`, `icon-512.png` → icônes
  - `og-image.jpg` (1200×630) → image de partage
  - `ambiance-1..3.(webp|jpg)` → photos d'ambiance (**pas des réalisations Mira** : bandeau d'ambiance uniquement)
- `brief/assets/brand/` → logos sources haute définition (ne pas servir tels quels).
- `brief/references/` → captures de true-story.fr et weezagency.com. On copie leurs **fonctionnalités** (prise de RDV, carrousel vidéo, bandeau logos, FAQ, bouton contact flottant), pas leur style.
- `brief/videos/` → vidéos brutes de nos réalisations (peut être vide).

`brief/` ne doit jamais être servi par le serveur : `/brief/...` doit répondre 404.

---

## 2. Vue d'ensemble : garder / transformer / supprimer

| Élément actuel | Décision |
|---|---|
| DA beige/bordeaux (`--paper:#F6F3EE`, `--accent:#5A1A2C`, teintes `--tint-*`, halos, grain) | **Remplacée** par la DA noir/blanc de la brochure (§3) |
| Police Archivo (titres) | **Supprimée** → Inter partout |
| Mode sombre (`[data-theme="dark"]`, bouton `.theme-toggle`, clé localStorage `mira-theme`) | **Supprimé sur les 7 pages** |
| Logo texte `.logo` + `.logo-dot` | **Remplacé** par le SVG `wordmark-mira.svg` (vrai logo, m italique) |
| Identité de marque (m italique, œil, « mira . ») | **Ajoutée** et déployée selon la charte du §4.1 |
| Réponse 404 en texte brut (`'Page introuvable.'`) | **Remplacée** par une page 404 à l'image de la marque |
| Curseur `.cursor-ring` + effet `.magnetic` | **Supprimés** |
| Barre `.scroll-progress` | **Supprimée** |
| Bouton `.back-to-top` (fixé en bas à droite, 24px) | **Supprimé** : il occupe la place du bouton contact flottant |
| `.skip-link`, `.reveal`, scrollspy, header compact `.is-scrolled`, `.toast`, copie d'email | **Gardés** |
| Animation des mots du hero (`.word`, `--i`, `body.is-loaded`) | **Gardée**, avec la nouvelle accroche |
| Bandeau `.marquee` (8 prestations) | **Retiré du hero**, CSS **réutilisé** pour le bandeau de logos clients (§5.11) |
| `#services` (8 lignes `.service-row`) | **Réduit à 3 lignes**, même composant |
| `#methode` (`.process-grid`) | **Gardé**, contenu remplacé par les 4 étapes de la brochure |
| `#realisations` (filtres + 6 cartes « Bientôt en ligne ») | **Supprimé** → carrousel vidéo |
| `#apropos` (« Peu de prestations… agence de communication… ») | **Remplacé** par « Pourquoi Mira » (bénéfices brochure) |
| `#espace` (maquette espace client) | **Retiré de la vitrine** (accès conservé dans le footer + FAQ) |
| `#temoignages` (modèles commentés + `.testimonial-placeholder`) | **Transformé** : vidéos + modèles d'avis texte conservés, section masquée tant que vide |
| `#faq` (`details/summary`) | **Gardé**, contenu remplacé |
| `#contact` (section sombre `.contact`) | **Gardé**, contenu enrichi |
| Footer 5 colonnes | **Gardé**, liens corrigés |
| `rendez-vous.html` + `/api/rendez-vous` | **Gardé** comme alternative « Être rappelé » |
| `connexion.html`, `espace-equipe.html`, `suivi.html` | **Restyle uniquement** |
| `mentions-legales.html`, `confidentialite.html` | **Contenu corrigé** + restyle |
| `mira.html` | **Ne pas toucher** (autre projet, non servi) |

---

## 3. Fondations partagées (étape 1)

### 3.1 `assets/css/tokens.css` — chargé par les 7 pages

Toutes les pages utilisent déjà les mêmes noms de variables. **Garde ces noms** pour ne pas réécrire les styles, et change seulement leurs valeurs :

```css
:root{
  color-scheme: light;
  --ink:#0a0a0a;          /* était #121212 */
  --paper:#ffffff;        /* était #F6F3EE */
  --paper-deep:#f5f5f3;   /* était #ECE7DD — = --off de la brochure */
  --accent:#0a0a0a;       /* était bordeaux #5A1A2C : plus de couleur d'accent */
  --grey:#6b6b6b;         /* labels et textes secondaires (contraste AA) */
  --grey-display:#8c8c8c; /* 2e ligne "light" des grands titres */
  --text:#555555;         /* texte courant */
  --border:#e0e0e0;       /* filets fins */
  --line:#0a0a0a;         /* filets forts entre sections */
  --font-display:'Inter', sans-serif;
  --font-body:'Inter', sans-serif;
}
```

Puis, dans chaque page :
- supprime le bloc `:root{...}` inline, **tous** les blocs `[data-theme="dark"]` et toutes les règles qui en dépendent ;
- remplace les `--tint-*` et `--glow-*` par `--paper` ou `--paper-deep`, et supprime les halos (`.hero::before`, `.placeholder-visual::after`) ainsi que le grain `body::before` ;
- `--ok` dans `suivi.html` peut rester (couleur fonctionnelle d'état) si son contraste est suffisant.

### 3.2 Police
`fonts/inter-latin.woff2` et `inter-latin-ext.woff2` sont des **fichiers variables** (vérifié : les graisses 300/400/700 rendent des largeurs différentes). Dans `fonts/fonts.css` :
- remplace les déclarations Inter 400 et 500 par une seule déclaration par sous-ensemble avec `font-weight: 100 900` ;
- fais de même pour l'italique (`inter-italic-*.woff2`, `font-style: italic`, `font-weight: 100 900`) : le m italique en texte (`.brand em`) doit utiliser la **vraie italique** d'Inter, pas une italique synthétique. Vérifie dans le navigateur qu'un `<em>` en 700 rend bien en gras italique ;
- supprime les déclarations Archivo et les fichiers `archivo-*.woff2`.

### 3.3 Logo et icônes (7 pages)
- Remplace `<a class="logo">mira<span class="logo-dot"></span></a>` par `<a class="logo" href="/" aria-label="mira. — accueil">` contenant le **SVG `wordmark-mira.svg` en inline** (pour hériter de `currentColor` : noir sur fond clair, blanc sur fond noir), hauteur 28px desktop / 24px mobile. Supprime le CSS `.logo-dot`.
- Remplace le favicon SVG inline actuel par `<link rel="icon" href="/assets/img/brand/favicon.svg" type="image/svg+xml">` + `favicon.ico` en repli + `apple-touch-icon.png` + `icon-512.png`.
- `<meta name="theme-color" content="#ffffff">`.

### 3.4 Suppression du mode sombre (7 pages)
Supprime les boutons `.theme-toggle`, leur CSS, leur JS (`applyTheme`, `mira-theme`, `prefers-color-scheme`) et le script de lecture du thème dans `mentions-legales.html` et `confidentialite.html`.

### 3.5 Config centrale — `assets/js/config.js`

```js
export const SITE = {
  nom: "Mira",
  baseline: "On filme. Vous existez.",
  domaine: "https://mira.agency",            // TODO_VERIFIER_DOMAINE_ACHETE
  telephoneAffiche: "07 61 59 89 99",
  telephoneLien: "+33761598999",
  whatsapp: "33761598999",
  whatsappMessage: "Bonjour Mira, je viens de votre site et j'aimerais en savoir plus.",
  email: "mira.soixantequinze.contact@gmail.com",
  instagram: "mira_soixantequinze",
  tiktok: "",                                // vide = lien masqué
  linkedin: "",                              // vide = lien masqué
  booking: { provider: "cal", lien: "TODO_LIEN_CAL", dureeMin: 20 }, // provider: "cal" | "calendly"
  legal: {
    nomCommercial: "Mira",
    editeur: "TODO_PRENOM_NOM",
    statut: "Entrepreneur individuel (EI)",
    siret: "TODO_SIRET",
    adresse: "TODO_ADRESSE_OU_DOMICILIATION",
    directeurPublication: "TODO_PRENOM_NOM",
    tva: "TVA non applicable, art. 293 B du CGI", // TODO_VERIFIER
    hebergeur: "TODO_HEBERGEUR (nom, adresse, téléphone)",
  },
  zone: "Paris & Île-de-France",
};
```

Les infos de contact et légales doivent **aussi être écrites en dur dans le HTML** (SEO, fonctionnement sans JS). Le JS ne fait que compléter (lien Cal, WhatsApp pré-rempli, masquage des réseaux vides). Mets un commentaire `<!-- SYNC config.js -->` à côté de chaque valeur dupliquée.

### 3.6 Serveur — seules modifications autorisées dans `server/`
1. **Statiques** dans `server.js`, à côté de la ligne `app.use('/fonts', …)` :
   `app.use('/assets', express.static(path.join(ROOT,'assets'), { maxAge:'7d', index:false }))` et la même chose pour `/videos` (les requêtes Range doivent marcher, c'est le comportement par défaut d'`express.static`).
2. **CSP** (constante `CSP`) : ajoute uniquement ce qu'exige l'embed Cal.com (`https://app.cal.com` et, si nécessaire, `https://cal.com`) dans `script-src`, `frame-src` (remplace `'none'`), `connect-src`, et `img-src`/`style-src` si la console l'exige. Si `provider: "calendly"`, ajoute de même les domaines Calendly. Ne relâche rien d'autre : `frame-ancestors 'none'` et `X-Frame-Options: DENY` restent.
3. **`/robots.txt` et `/sitemap.xml`** : deux routes qui servent des fichiers racine (vitrine, rendez-vous, mentions-légales, confidentialité ; jamais connexion, suivi ni espace-equipe). Ajoute `Disallow: /connexion /suivi /espace-equipe /api/`.
4. **`server/db.js`** : chemin de base configurable, `process.env.DB_PATH || path.join(__dirname, 'mira.db')` (nécessaire pour un disque persistant en production). Ajoute `DB_PATH` commenté dans `.env.example`.
5. **Page 404** : le dernier handler `app.use((req, res) => res.status(404).send('Page introuvable.'))` sert désormais `404.html` (racine) avec le statut 404. Le contenu est au §4.1.
6. Ne touche ni à `PUBLIC_PAGES` (aucune nouvelle page publique), ni aux routes `/api`, ni aux sessions, ni à l'anti-CSRF.

---

## 4. Direction artistique (issue de la brochure)

- **Titres** : Inter 700, MAJUSCULES, interlignage ~0.92, letter-spacing -0.04em sur les très grands titres. Deuxième ligne en Inter 300 couleur `--grey-display` via `<span class="light">`, exactement comme « Packs / *Découverte.* » dans la brochure. Hero : `clamp(56px, 12vw, 160px)`. `.section-head h2` : `clamp(2rem, 4.5vw, 3.5rem)`.
- **Kickers** : remplacent `.eyebrow`. 11px minimum (la brochure en met 9, trop petit à l'écran), 700, majuscules, letter-spacing 0.25em, `--grey`.
- **Texte courant** : 15–16px sur mobile, interlignage 1.7, `--text`.
- **Grille** : sur desktop, chaque `.section-head` passe en grille `260px 1fr` (titre à gauche, texte à droite) comme la brochure. Une colonne sur mobile.
- **Filets** : 1px `--line` entre sections (remplace l'alternance de fonds teintés), 1px `--border` entre éléments d'une liste. Bandes noires pleines de 16px pour les séparations fortes (avant les Offres et avant le Contact).
- **Angles droits partout** : `border-radius: 0` sur boutons, cartes, champs et filtres. Seule exception : le bouton contact flottant, rond.
- **Boutons** : `.btn-primary` noir plein, texte blanc, majuscules 12px letter-spacing 0.15em. Au survol, inversion blanc / bordure noire. Variante `.btn-ghost` : bordure 1px noire.
- **Tags** : encadrés 1px noir, 11px, majuscules — Vidéos 4K, Étalonnage, TikTok Trends, Community Management, Graphisme & Logos.
- **Bloc mis en avant** : inversion noir/blanc (cf. `.pack-recommended` de la brochure).
- **Motion** : on garde `.reveal`, ramené à translateY(12px) en 400 ms. Tout est désactivé sous `prefers-reduced-motion` (règle déjà présente, à conserver).
- **Rédaction** : n'utilise **jamais** « agence de communication » dans les titres, le hero, les CTA, la `<title>` ni la meta description. Nos prospects (restaurateurs, commerçants) décrochent sur ce mot. Parle de résultats concrets : plus de passage, de réservations, de visibilité locale.

### 4.1 Identité de marque — charte d'usage (à respecter partout)

L'identité repose sur 3 éléments du logo : le **wordmark « mira . »**, le **« m » italique** et **l'œil**. Ils doivent être reconnaissables sur tout le site, sans saturer la page : chaque élément a des emplacements précis.

**A. Le nom en texte**
- En texte courant, la marque s'écrit **en minuscules avec le m en italique** : `<span class="brand"><em>m</em>ira</span>`. Exemple : « Chez *m*ira, on tourne dans votre lieu… ».
- Dans les moments de marque (titres, signatures, footer), on ajoute le point : `<span class="brand"><em>m</em>ira.</span>`.
- Signature du domaine : `<span class="brand"><em>m</em>ira.agency</span>`. Signature Instagram : `by <span class="brand"><em>m</em>ira.soixantequinze</span>`.
- `.brand` hérite de la graisse et de la taille du contexte. Seul le `em` passe en italique (vraie italique Inter, §3.2).
- **Noms des packs** : même règle, sans majuscules forcées : « *m*ira Flash », « *m*ira Essentiel », « *m*ira Essentiel+ », « *m*ira Classic », « *m*ira Management », « *m*ira Logo » (« Pack Premium » reste tel quel).
- Interdit dans le texte visible : « Mira Agency », « MIRA » en capitales, « Mira » sans italique quand c'est le nom de la marque. Exceptions, qui gardent « Mira » en texte brut (pas de HTML possible) : `<title>`, meta, JSON-LD, `alt`, `aria-label`, notes pré-remplies dans Cal.com, objets de mail et message WhatsApp.

**B. Le « m » italique (`m-italique.svg`) = la signature**
- Favicon (`favicon.svg`).
- **Signature sur chaque carte vidéo** des réalisations et des témoignages : petit m blanc (14px, opacité 0.8, ombre portée très légère) en bas à droite de la vidéo, comme une signature de réalisateur.
- En-tête de la modale RDV (§6.1).
- Puce des kickers de section : un m italique de 0.9em devant le texte du kicker (`<span class="kicker"><svg …m…></svg> On a filmé.</span>`), en `--grey`. Applique-le à tous les kickers de la vitrine.
- Pas ailleurs : pas en motif de fond ni en filigrane répété.

**C. L'œil (`oeil-*.webp`) = le regard**
L'œil porte le concept de la marque : on vous regarde, on vous filme, vous existez. Il apparaît **à 4 endroits seulement** :
1. **Hero** : à droite, au-dessus du texte d'introduction (desktop) ou entre l'accroche et le texte (mobile). Il apparaît en fondu (opacité 0→1, échelle 0.96→1, 600 ms) juste après l'animation des mots du titre. Statique sous reduced-motion.
2. **Contact final** (fond noir) : œil blanc au-dessus de « À vous / *d'exister.* ».
3. **Page 404** (`404.html`) : œil centré, titre « Cette page / *n'existe pas.* », sous-titre « Vous, si. », bouton « Retour à l'accueil ». Header et footer identiques à la vitrine.
4. **Connexion** (`connexion.html`) : petit œil (64px) au-dessus du formulaire.

**Tailles max** : le fichier source est petit et granuleux. Utilise toujours `<picture>` avec `oeil-*@2x.webp` en `srcset` 2x. Taille CSS **max 240px de large** (hero desktop), 140px (hero mobile et contact), 64px (connexion). Ne l'agrandis jamais au-delà : le grain devient flou. **Si un fichier `brief/assets/brand/oeil-hd.png` (ou `.svg`) est présent, utilise-le à la place** : la limite passe alors à 420px dans le hero.

**D. Le wordmark « mira . » (`wordmark-mira.svg`)**
- Header de toutes les pages (§3.3).
- **Footer géant** : à la toute fin du site, le wordmark en blanc sur toute la largeur du conteneur (§5.16). C'est le dernier élément vu.
- Image OG (déjà faite).

**E. Interdits**
Pas d'écran de chargement ou d'intro animée avec le logo (sur mobile depuis Instagram, chaque seconde d'attente fait fuir). Pas de déformation, de couleur autre que noir ou blanc, ni de contour sur le logo et l'œil. Pas de « m » ni d'œil dans le bouton contact flottant : l'icône bulle reste plus compréhensible.

**F. Détails**
`::selection { background:#0a0a0a; color:#fff; }`. Lien actif de la nav souligné d'un filet noir de 1px (on garde l'animation `::after` existante, recolorée en noir).

---

## 5. `index.html` — modifications section par section (étapes 2 à 5)

Sors le CSS inline (~l.39–797) dans `assets/css/site.css` et le JS inline (~l.1290–1456) dans `assets/js/site.js` (module ES), puis applique ce qui suit.

### 5.0 `<head>` (~l.7–37)
- `<title>Mira — Vidéos & réseaux sociaux pour commerces à Paris</title>`
- meta description : « On filme votre lieu, vous existez sur Instagram et TikTok. Vidéos 4K, étalonnage, community management pour restaurants et commerces à Paris et en Île-de-France. »
- OG/Twitter : même titre et description, `og:image` = `/assets/img/og-image.jpg`, `twitter:card` = `summary_large_image`. Décommente `og:url` et `canonical` avec `SITE.domaine` (TODO si non confirmé).
- JSON-LD `ProfessionalService` : `name` « Mira », description recentrée sur vidéo / réseaux sociaux, `telephone`, `email`, `areaServed` « Île-de-France », `sameAs` Instagram, `knowsAbout` : Production vidéo, Étalonnage, Contenus TikTok et Instagram, Community management, Identité visuelle.
- Charge `fonts/fonts.css`, `assets/css/tokens.css`, `assets/css/site.css`.

### 5.1 Éléments globaux
- Supprime `.scroll-progress`, `.cursor-ring`, `.back-to-top` (HTML, CSS, JS) et toutes les classes `.magnetic`.
- Garde `.skip-link`, `#toast`, la logique `.reveal`, le scrollspy et `.is-scrolled`.

### 5.2 Header (~l.813–846)
- Logo image (§3.3).
- Nav : Réalisations · Offres · Méthode · FAQ · Contact. Ces ancres doivent exister.
- `.nav-cta` : texte « Réserver un appel », ouvre la modale RDV (`data-open-booking`) au lieu de pointer vers `rendez-vous.html`. Sur mobile, ajoute ce bouton en bas du menu ouvert.
- Supprime `.theme-toggle`. Garde `.nav-toggle` et son JS.

### 5.3 Hero (~l.853–864) → hero + bandeau d'ambiance
- Kicker : « Vidéo & réseaux sociaux — Paris ».
- `h1` : garde le système `.word` + `--i`. Mots : `On` `filme.` puis, dans `<span class="light">`, `Vous` `existez.`, avec un saut de ligne par mot sur mobile comme dans la brochure.
- `.hero-sub` : « Quelle que soit votre activité, avoir une présence récurrente et qualitative sur les réseaux sociaux avec des contenus vidéo adaptés aux tendances actuelles change la donne. »
- Les 5 tags (§4).
- `.hero-actions` : `.btn-primary` « Découvrir notre offre » (ouvre la modale) + `.btn-ghost` « Voir nos réalisations » (`#realisations`).
- **L'œil** (§4.1 C) : en haut de la colonne droite, au-dessus de `.hero-sub`.
- Sur desktop, mise en page en 2 colonnes comme la brochure : accroche à gauche ; œil, texte, tags et boutons à droite, alignés en bas.
- **Remplace le `.marquee` des prestations (~l.867–872)** par un bandeau de 3 photos d'ambiance (`ambiance-1..3`, `<picture>` WebP + JPG, `loading="lazy"` sauf la première, filets noirs entre les photos, hauteur 220px desktop, défilement horizontal sur mobile). Si `videos/showreel.mp4` existe, il remplace les photos (muet, en boucle, `playsinline`, poster obligatoire).

### 5.4 `#realisations` (~l.993–1054) — « On a filmé. »
- Supprime `.work-filters`, `.work-grid`, `.work-card`, `.placeholder-visual` et leur JS de filtre (~l.1395–1408).
- Remplace par un carrousel horizontal de cartes vidéo 9:16 rendu depuis `assets/data/realisations.js` :
  - scroll-snap natif, flèches sur desktop, swipe sur mobile, la carte suivante dépasse pour inviter au swipe ;
  - chaque carte a un **poster obligatoire** (jamais de carte noire pendant le chargement, défaut constaté chez true-story), `preload="none"`, `muted playsinline loop`. L'aperçu (`preview`) ne joue que lorsque la carte est visible (IntersectionObserver) ;
  - tap/clic → lightbox plein écran avec la vidéo complète et le son, fermeture Esc / croix / swipe vers le bas, focus géré ;
  - sous chaque carte : client, lieu, format (Fragments / Mirage / TikTok Trend) ;
  - signature « m » italique en bas à droite de chaque vidéo (§4.1 B).
- Si `realisations.js` est vide, la section **et** son lien de nav sont retirés.

### 5.5 Nouvelle section `#avant-apres` (juste après Réalisations)
Kicker « Le détail qui change tout », titre « Avant / *après.* ». Comparateur d'images depuis `assets/data/avantApres.js` : deux images superposées, poignée verticale déplaçable (souris, tactile, clavier, avec un `<input type="range">` pour l'accessibilité), labels « Brut » / « Étalonné ». Une phrase : « L'étalonnage est inclus dans toutes nos vidéos. » Section retirée si les données sont vides.

### 5.6 `#services` (~l.877–951)
Garde `.services-list` et `.service-row`. Titre : « Ce qu'on / *fait.* ». Remplace les 8 lignes par 3 :
1. **Réalisation vidéo** — Tournage 4K discret dans votre lieu, montage et étalonnage, formats pensés pour Instagram et TikTok.
2. **Community management** — Stratégie éditoriale, calendrier de publication et gestion de vos comptes.
3. **Identité visuelle & logos** — Refonte de votre charte graphique pour une image cohérente partout.

Chaque ligne ouvre la modale RDV (au lieu de `href="#contact"`). Supprime les `transition-delay` des lignes 4 à 8.

### 5.7 Nouvelle section `#offres` — « Nos formules / *à titre indicatif.* »
Bande noire de 16px avant la section.
- Note sur fond `--paper-deep` (texte de la brochure, adapté) : « Les formules présentées sont indicatives et constituent une base de travail. Chaque projet est unique : le tarif est fixé sur devis après un appel de 20 min, gratuit et sans engagement. »
- **Packs Découverte — 1er mois, sans engagement** : 3 cartes (Mira Flash, **Mira Essentiel** inversée noir avec « ★ Recommandé », Mira Essentiel+). Reprends **exactement** le contenu de la brochure, **sans aucun prix**. Bouton par carte : « Découvrir cette offre ».
- **Formules mensuelles** : un `<details>` fermé « Voir les formules mensuelles » avec Mira Classic, Mira Management, Mira Logo et Pack Premium, une ligne chacune (nom + ce qui la distingue : développement / community management complet / refonte de charte / tout inclus), sans quantités.
- Chaque bouton ouvre la modale RDV et **pré-remplit le pack** dans les notes Cal.com (`config: { notes: "Intéressé par : Mira Essentiel" }`).

### 5.8 `#methode` (~l.956–986) — « Quatre / *étapes.* »
Garde `.process-grid` / `.process-step`. Remplace le contenu par les 4 étapes de la brochure : **Étude du projet** (Analyse, prise d'informations, d'idées et préparation d'un plan détaillé pour la suite) · **Tournage** (Discret, rapide et adapté au rythme de votre lieu. Matériel professionnel) · **Montage & livraison** (Formats optimisés pour chaque réseau. Étalonnage et colorimétrie soignés) · **Publication** (Stratégie éditoriale et calendrier de publication pour maximiser la portée de chaque contenu).

### 5.9 `#apropos` (~l.1059–1070) → `#pourquoi` — « Ce que vous / *gagnez.* »
Remplace tout le contenu (y compris la phrase « agence de communication »). Grille de 4 cases bordées de noir (4 colonnes desktop, 2 tablette, 1 mobile) avec les 4 bénéfices de la brochure : Visibilité en ligne & locale · Engagement authentique · Plus de clients & réservations · Flexibilité totale. **Aucun concurrent cité, aucune comparaison** (la publicité comparative est très encadrée en France).

### 5.10 `#espace` (~l.1075–1099)
Supprime la section de la vitrine (HTML + CSS `.portal`, `.portal-mock`). L'accès reste dans le footer et dans la FAQ.

### 5.11 Nouvelle section `#clients` — « Ils nous font / *confiance.* »
Bandeau de logos depuis `assets/data/clients.js`, construit en **réutilisant le CSS `.marquee` / `.marquee-track` / `@keyframes marquee-scroll` existant** (contenu dupliqué, pause au survol, version statique sous reduced-motion). Logos en niveaux de gris, couleur au survol. **Section rendue seulement s'il y a au moins 4 logos.**

### 5.12 `#resultats` — « Les chiffres / *parlent.* » (nouvelle)
Depuis `assets/data/resultats.js` : cartes « @handle — 1 200 → 8 400 abonnés en 3 mois » avec captures avant/après et date du relevé en petit, plus la mention « Chiffres publiés avec l'accord du client ». Retirée si vide.

### 5.13 `#temoignages` (~l.1112–1165) — « Ils / *existent.* »
- Ajoute en tête un carrousel de **vidéos** 9:16 (interviews de fin de tournage) depuis `assets/data/temoignages.js`, avec le même composant qu'en 5.4 et une citation courte sous chaque vidéo.
- **Garde** les 3 modèles d'avis texte commentés (`.review-card` Instagram / TikTok / Google) et le commentaire d'honnêteté au-dessus : ils servent pour les avis écrits.
- **Supprime** `.testimonial-placeholder`. S'il n'y a ni vidéo ni avis réel, la section entière est retirée.
- Garde la ligne « Vous avez travaillé avec Mira ? Partagez votre avis » (sujet du mail : « Mon avis sur Mira »).

### 5.14 `#faq` (~l.1170–1203) — « Questions / *réponses.* »
Garde `details/summary`. Ajoute une numérotation 01, 02… et une seule question ouverte à la fois. Nouveau contenu :
1. **Combien de temps dure un tournage ?** — Une demi-journée à deux après-midis selon la formule. On s'adapte au rythme de votre lieu, sans perturber votre activité. `<!-- TODO_VALIDER -->`
2. **En combien de jours je reçois mes vidéos ?** — TODO_DELAI_LIVRAISON.
3. **Faut-il fermer mon établissement pendant le tournage ?** — Non. Le tournage est discret et rapide, avec du matériel professionnel.
4. **Y a-t-il un engagement ?** — Non : le premier mois est sans engagement. Vous continuez si les résultats sont là.
5. **Sur quels réseaux publiez-vous ?** — Instagram et TikTok, avec des formats optimisés pour chacun.
6. **Combien ça coûte ?** — (reprends la réponse actuelle « Combien coûte un projet ? » en remplaçant le périmètre par vidéos / community management / identité visuelle) + bouton « Réserver un appel ».
7. **À qui appartiennent les vidéos ?** — TODO_DROITS_UTILISATION (à définir dans le contrat).
8. **Travaillez-vous hors de Paris ?** — Tournages à Paris et en Île-de-France ; au-delà, sur demande. `<!-- TODO_VALIDER -->`
9. **Comment suivre l'avancement de mon projet ?** — (garde la réponse actuelle sur l'espace projet, avec le lien vers la connexion client).

Supprime « Comment se déroule le premier contact ? » et « Puis-je ne prendre qu'une seule prestation ? ».

### 5.15 `#contact` (~l.1208–1218) — « À vous / *d'exister.* »
Garde la section sombre `.contact`, précédée d'une bande noire de 16px.
- **Œil blanc** au-dessus du titre (§4.1 C).
- Gros bouton blanc « Réserver un appel de 20 min » (modale).
- En dessous, une liste en grille : Téléphone (`tel:`), WhatsApp (`https://wa.me/{whatsapp}?text={message}`), Email (lien `mailto:` + bouton `#copy-email` existant, à garder), Instagram (`https://instagram.com/{handle}` et DM `https://ig.me/m/{handle}`), TikTok seulement s'il est renseigné.
- Lien discret : « Vous préférez qu'on vous rappelle ? » → `rendez-vous.html`.
- Le JS de copie lit l'adresse depuis `SITE.email` au lieu de la chaîne en dur.

### 5.16 Footer (~l.1228–1285)
- **Le footer passe en noir** et prolonge la section contact : un seul bloc noir, séparé par un filet blanc à 15 % d'opacité. Textes en blanc, liens secondaires en `#a0a0a0`.
- Colonne logo : `monogramme-m-blanc` (m + œil + by mira.soixantequinze) et, en dessous, la signature `<em>m</em>ira.agency` (§4.1 A).
- Navigation : les nouvelles ancres.
- Contact : « Réserver un appel » (modale) · « Être rappelé » (`rendez-vous.html`) · email.
- Réseaux : remplace les `href="#"` par les vrais liens. Les réseaux vides dans la config sont **retirés** (ne laisse aucun lien mort).
- Légal et Espace : inchangés.
- Ligne du bas : `© <span id="year"></span> <em>m</em>ira — {editeur} EI — SIRET {siret}` · `Paris, Île-de-France`. Ne mets jamais « Mira Agency. Tous droits réservés », ni « SAS », « SARL » ou « Inc. ».
- **Wordmark géant** tout en bas, sous la ligne légale : `wordmark-mira.svg` inline en blanc, `width: 100%` du conteneur, `aria-hidden="true"` (décoratif, le nom est déjà lisible au-dessus). Il apparaît en montant de 24px au scroll, statique sous reduced-motion. Pas de marge sous lui : le site se termine sur le logo.
- Ce footer noir avec wordmark géant est **commun à toutes les pages publiques** : vitrine, rendez-vous, mentions légales, confidentialité, 404. Les pages connexion / espace / suivi gardent un footer minimal.

---

## 6. Composants nouveaux (`assets/js/`, étape 6)

### 6.1 Modale de prise de RDV — `booking.js`
- Tout élément `[data-open-booking]` ouvre la modale. Un `data-pack="Mira Essentiel"` optionnel pré-remplit les notes.
- Embed officiel **Cal.com en inline** : plein écran sur mobile, centré sur desktop (max 960px), thème clair, couleur de marque `#0a0a0a`.
- En-tête de la modale, au-dessus de l'agenda : m italique (§4.1 B) + « Réserver un appel / *20 min, gratuit.* » + bouton fermer. Si un pack est pré-rempli, on l'affiche en tag sous le titre.
- **Script chargé seulement à la première ouverture** : aucune requête vers un tiers au chargement de la page (c'est une promesse de la politique de confidentialité actuelle).
- `provider: "calendly"` doit aussi marcher (embed inline Calendly).
- Si le lien vaut encore `TODO_LIEN_CAL` ou si le script échoue : la modale affiche « Réservez par téléphone ou laissez-nous vos coordonnées » avec les liens Appeler / WhatsApp / `rendez-vous.html`. **Jamais de modale vide.**
- Accessibilité : `role="dialog"`, `aria-modal`, focus piégé, Esc, retour du focus au bouton d'origine.
- On ne redirige jamais vers un site externe pour réserver (Weez le fait, et on perd du monde au chargement).

### 6.2 Bouton contact flottant — `contact-fab.js`
- Rond noir de 56px, icône bulle blanche, `position: fixed`, `right: 16px`, `bottom: calc(16px + env(safe-area-inset-bottom))`. Uniquement sur `index.html`, `mentions-legales.html` et `confidentialite.html`.
- Au clic : petit panneau à angles droits avec 4 actions : Réserver un appel (modale) · WhatsApp · Appeler · Écrire sur Instagram.
- **Ne masque jamais de contenu** (défaut constaté chez true-story, où il couvre les textes et la FAQ) : padding-bottom suffisant en bas de page sur mobile, et le bouton se cache quand `#contact` ou le footer est visible.
- `aria-expanded`, fermeture Esc / clic extérieur.

### 6.3 Rendu des données — `sections.js`
Lit `assets/data/*.js` et construit les sections 5.4, 5.5, 5.11, 5.12 et 5.13. Règles :
- tableau vide → section **et** lien de nav correspondant retirés du DOM ;
- les entrées `demo: true` ne s'affichent que si `location.hostname` vaut `localhost` ou `127.0.0.1` (pour tester les composants) ;
- formats de données :
  - `realisations.js` : `{ client, lieu, format, video, preview, poster, instagramUrl? }`
  - `avantApres.js` : `{ avant, apres, legende }`
  - `resultats.js` : `{ client, handle, abonnesAvant, abonnesApres, periode, captureAvant, captureApres, dateReleve }`
  - `temoignages.js` : `{ client, nom, role, video, poster, citationCourte }`
  - `clients.js` : `{ nom, logo, url? }`

---

## 7. Pages secondaires (étape 7)

**Pour les pages existantes ci-dessous : ne modifie aucun `id`, aucun `name` de champ, aucune URL d'API, aucune logique de script** (hors suppression du thème sombre). Charge `tokens.css`, applique le logo (§3.3), les angles droits, Inter et les filets noirs.

- **`rendez-vous.html`** :
  - `<title>` et `h1` : « Être rappelé » ;
  - sous-titre : « Laissez vos coordonnées, on vous rappelle au créneau de votre choix. » + lien « Vous préférez choisir votre créneau tout de suite ? Réserver un appel » (charge `booking.js` pour ouvrir la modale sur cette page) ;
  - champs du formulaire et options du `select#situation` **inchangés** (le serveur les valide) ;
  - footer : même ligne légale que la vitrine.
- **`connexion.html`, `espace-equipe.html`, `suivi.html`** : restyle uniquement. Le mot « Agency » disparaît des titres affichés (« Espace équipe — *m*ira », etc.). Sur `connexion.html`, ajoute le petit œil au-dessus du formulaire (§4.1 C).
- **`404.html`** (nouvelle, servie par le handler 404, §3.6) : voir §4.1 C.
- **`mentions-legales.html`** : réécris pour une **entreprise individuelle**. Éditeur : `{editeur}`, `{statut}`, nom commercial « Mira », SIRET, adresse, téléphone, email, mention TVA. Ajoute le directeur de la publication et l'hébergeur. Supprime « Capital social », « RCS » et « forme juridique ». Remplace « Mira Agency » par « Mira ». Dans « Données personnelles », la phrase sur les cookies reste vraie (aucun cookie publicitaire ni mesure d'audience).
- **`confidentialite.html`**, modifications précises :
  - §1 Responsable du traitement : `{editeur}`, EI, exerçant sous le nom commercial Mira, adresse ;
  - §2 ajoute : « Prise de rendez-vous en ligne : nom, e-mail, téléphone et réponses aux questions du formulaire de réservation, collectés via Cal.com lorsque vous ouvrez l'agenda » ;
  - §5 ajoute Cal.com comme sous-traitant (raison sociale, pays, encadrement des transferts : `TODO_VERIFIER`) et remplace « Le site n'appelle aucun service tiers… » par : « Le site n'appelle aucun service tiers au chargement des pages. L'agenda Cal.com n'est chargé que si vous cliquez pour réserver un appel. » ;
  - §6 supprime la ligne `mira-theme` (le mode sombre n'existe plus) ;
  - « Mira Agency » → « Mira » ; date de mise à jour = date du jour.
- **`server/README.md`** : met à jour la section RGPD (Cal.com) et le chemin `DB_PATH`.
- **`server/REGISTRE-RGPD.md`** : ajoute le traitement « Prise de RDV en ligne (Cal.com) » et Cal.com comme sous-traitant.

---

## 8. Vidéos — pipeline de compression (étape 8)

Crée `scripts/prepare-videos.mjs` et un `package.json` **racine** minimal (`"private": true`, script `"videos"`), indépendant de `server/package.json`. Le script utilise ffmpeg installé sur la machine ; s'il manque, explique comment l'installer sous Windows (`winget install ffmpeg`). Pour chaque fichier de `brief/videos/`, il produit dans `videos/` :
- `nom.mp4` : H.264, 720×1280 max, CRF 28, `-preset veryfast`, `-movflags +faststart`, AAC 96k ;
- `nom-preview.mp4` : 6 premières secondes, sans audio, CRF 30 ;
- `nom-poster.jpg` : image à 1 s, qualité 80.

Il affiche la taille de chaque fichier, alerte au-dessus de 8 Mo et imprime la ligne prête à coller dans `realisations.js`.

---

## 9. Vérifications (étape 9 — tu les fais toi-même sur http://localhost:3000)

1. Le serveur démarre sans erreur. Connexion équipe OK, connexion client OK, suivi OK. Le formulaire `rendez-vous` enregistre une demande et elle apparaît dans l'espace équipe.
2. `/brief/x`, `/server/db.js`, `/.claude/settings.local.json` et `/mira.html` répondent 404.
3. Captures Playwright 390×844 et 1440×900 de chaque page dans `brief/captures-apres/`. Compare-les avec `captures-avant/` et corrige tout ce qui est cassé ou incohérent.
4. Aucun scroll horizontal à 360px (`document.documentElement.scrollWidth <= innerWidth`).
5. À 390px, le bouton flottant ne recouvre aucun texte ni bouton (vérifie en scrollant section par section).
6. Navigation 100 % clavier : menu, carrousels, comparateur, FAQ, modale, bouton flottant.
7. Contraste AA sur tout le texte courant.
8. Au chargement de la vitrine : **zéro requête vers un domaine tiers** (onglet réseau), poids initial < 1 Mo hors vidéos, aucune vidéo téléchargée tant qu'elle n'approche pas de l'écran.
9. Modale : avec `TODO_LIEN_CAL`, affichage du repli ; avec un vrai lien (teste `rick/get-rick-rolled` si tu n'en as pas d'autre, puis remets le TODO), l'agenda s'affiche, **aucune violation CSP en console**, pack pré-rempli.
10. Avec des données vides, les sections concernées et leurs liens de nav n'apparaissent pas. Hors localhost, aucune entrée `demo: true` ne s'affiche.
11. Plus aucune occurrence de « agence de communication », « Mira Agency » (texte visible), « Archivo », `data-theme`, `mira-theme`, `cursor-ring`, `back-to-top` ou `#5A1A2C` (`grep` sur le projet, hors `brief/`, `mira.html` et `node_modules`).
12. **Identité** :
    - l'œil n'est jamais affiché plus large que sa limite du §4.1 C (vérifie `getBoundingClientRect().width` sur chaque `<img>` d'œil, à 390px et à 1440px) ;
    - il apparaît exactement aux 4 emplacements prévus ;
    - chaque mention visible de la marque a son m en italique ;
    - le wordmark géant du footer est net à 1440px (SVG, pas de PNG agrandi) ;
    - `/une-page-qui-n-existe-pas` renvoie la page 404 de marque avec le statut 404.

---

## 10. Livrables (étape 10)

- Tout est commité sur `refonte-vitrine` (je fusionnerai moi-même).
- `README.md` **racine, en français, pour un non-développeur** :
  - lancer le site en local ;
  - ajouter une réalisation (vidéo dans `brief/videos/` → `npm run videos` → coller la ligne dans `assets/data/realisations.js`) ;
  - ajouter un logo client, un témoignage vidéo, un avis texte, un résultat avant/après ;
  - changer le lien Cal.com ;
  - mettre en ligne : hébergeur Node avec **disque persistant** pour la base (Railway + Volume monté et `DB_PATH` pointant dessus, ou équivalent), `NODE_ENV=production`, `SESSION_SECRET`, HTTPS, branchement du domaine. Précise que l'hébergement gratuit sans disque efface la base à chaque déploiement.
- **Rapport final** :
  - liste exhaustive des `TODO_` restants (fichier + ligne) ;
  - résultat de chaque point du §9 ;
  - ce que tu n'as pas pu vérifier.

**Bonus — seulement si tout le §9 est validé :**
1. Webhook Cal.com → `POST /api/webhooks/cal` : vérification HMAC de l'en-tête `X-Cal-Signature-256` avec un secret dans `.env`, refus si invalide. Insertion dans `requests` avec `raison = "Réservation Cal.com — {date/heure}"`, `situation = "Réservation en ligne"` et `consent_at` = date de réservation. Les colonnes `prenom`, `nom`, `entreprise`, `email` et `telephone` sont `NOT NULL` : remplis-les depuis les réponses de réservation et, si l'une manque, mets « non renseigné » plutôt que de faire échouer l'insertion. La réservation apparaît ainsi dans « Demandes reçues ». L'anti-CSRF actuel laisse passer les requêtes sans en-tête `Origin` : vérifie que c'est bien le cas pour Cal.com, sans affaiblir la règle pour les autres routes.
2. Compteur d'événements interne, sans cookie et sans donnée personnelle (ouvertures de la modale RDV, clics WhatsApp, clics téléphone), affiché en totaux sur 30 jours dans l'espace équipe.
