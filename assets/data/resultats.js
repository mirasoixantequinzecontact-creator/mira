// ============================================================
//  RÉSULTATS — « Les chiffres parlent. » (#resultats)
//
//  Uniquement des chiffres RÉELS, publiés avec l'accord écrit du client,
//  avec les captures qui les prouvent et la date du relevé.
//  Tableau vide → la section disparaît du site.
//
//  Format : { client, handle, abonnesAvant, abonnesApres, periode,
//             captureAvant, captureApres, dateReleve }
//    handle      : compte Instagram/TikTok sans @ (ex. "lieu_paris")
//    periode     : ex. "3 mois"
//    captures    : images (ex. /assets/img/resultats/lieu-avant.jpg)
//    dateReleve  : ex. "12 octobre 2026"
//
//  demo: true → entrée de TEST, affichée seulement en local.
// ============================================================
export default [
  { demo: true, client: "DÉMO — lieu fictif", handle: "compte_demo", abonnesAvant: 1200, abonnesApres: 8400, periode: "3 mois", captureAvant: "/videos/demo/demo-1-poster.jpg", captureApres: "/videos/demo/demo-2-poster.jpg", dateReleve: "chiffres fictifs de test" },
];
