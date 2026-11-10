// ============================================================
//  RÉALISATIONS — carrousel « On a filmé. » (index.html, #realisations)
//
//  Uniquement de VRAIES vidéos tournées par mira (Code de la consommation,
//  art. L121-2 et suivants). Tableau vide → la section et son lien de nav
//  disparaissent du site.
//
//  Ajouter une vidéo :
//    1. déposez le fichier brut dans outils/videos-brutes/
//    2. lancez « npm run videos » dans le dossier server
//    3. collez ici la ligne affichée, puis complétez client / lieu / format
//
//  Format : { client, lieu, format, video, preview, poster, instagramUrl? }
//    format : "Fragments" | "Mirage" | "TikTok Trend"
//    poster : obligatoire (image affichée pendant le chargement)
//
//  demo: true → entrée de TEST, affichée seulement en local
//  (localhost, 127.0.0.1 ou fichier ouvert en double-clic), jamais sur le site en ligne.
// ============================================================
window.MIRA = window.MIRA || {};
MIRA.realisations = [
  { demo: true, client: "DÉMO — lieu fictif", lieu: "Paris 11e", format: "Fragments", video: "videos/demo/demo-1.mp4", preview: "videos/demo/demo-1-preview.mp4", poster: "videos/demo/demo-1-poster.jpg" },
  { demo: true, client: "DÉMO — lieu fictif", lieu: "Paris 3e", format: "Mirage", video: "videos/demo/demo-2.mp4", preview: "videos/demo/demo-2-preview.mp4", poster: "videos/demo/demo-2-poster.jpg" },
  { demo: true, client: "DÉMO — lieu fictif", lieu: "Boulogne", format: "TikTok Trend", video: "videos/demo/demo-3.mp4", preview: "videos/demo/demo-3-preview.mp4", poster: "videos/demo/demo-3-poster.jpg" },
  { demo: true, client: "DÉMO — lieu fictif", lieu: "Paris 18e", format: "Fragments", video: "videos/demo/demo-1.mp4", preview: "videos/demo/demo-1-preview.mp4", poster: "videos/demo/demo-1-poster.jpg" },
  { demo: true, client: "DÉMO — lieu fictif", lieu: "Vincennes", format: "Mirage", video: "videos/demo/demo-2.mp4", preview: "videos/demo/demo-2-preview.mp4", poster: "videos/demo/demo-2-poster.jpg" },
];
