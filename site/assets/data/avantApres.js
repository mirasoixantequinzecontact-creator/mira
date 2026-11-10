// ============================================================
//  AVANT / APRÈS — comparateur « Brut » / « Étalonné » (#avant-apres)
//
//  Deux images de la MÊME prise : avant et après étalonnage, issues d'une
//  vraie réalisation mira. Tableau vide → la section disparaît du site.
//
//  Format : { avant, apres, legende }
//    avant / apres : chemins d'images (ex. assets/img/avant-apres/lieu-avant.jpg), même cadrage, 16:9
//    legende : texte court sous le comparateur (lieu, format…)
//
//  demo: true → entrée de TEST, affichée seulement en local.
// ============================================================
window.MIRA = window.MIRA || {};
MIRA.avantApres = [
  { demo: true, avant: "videos/demo/compare-avant.jpg", apres: "videos/demo/compare-apres.jpg", legende: "DÉMO — image de test (photo d'ambiance désaturée)" },
];
