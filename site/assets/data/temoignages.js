// ============================================================
//  TÉMOIGNAGES VIDÉO — interviews de fin de tournage (#temoignages)
//
//  Uniquement de VRAIS clients, filmés avec leur accord.
//  Même pipeline que les réalisations : outils/videos-brutes/ → npm run videos.
//  Les avis ÉCRITS se publient directement dans index.html (modèles
//  .review-card commentés dans la section #temoignages).
//  Ni vidéo ni avis → la section disparaît du site.
//
//  Format : { client, nom, role, video, poster, citationCourte }
//    nom  : prénom + initiale (ex. "Sarah B.")
//    role : ex. "Gérante"
//    citationCourte : une phrase, ses mots exacts
//
//  demo: true → entrée de TEST, affichée seulement en local.
// ============================================================
window.MIRA = window.MIRA || {};
MIRA.temoignages = [
  { demo: true, client: "DÉMO — lieu fictif", nom: "Prénom N.", role: "Gérant·e (fictif)", video: "videos/demo/demo-3.mp4", poster: "videos/demo/demo-3-poster.jpg", citationCourte: "Citation de test — remplacez-la par les mots exacts d'un vrai client." },
];
