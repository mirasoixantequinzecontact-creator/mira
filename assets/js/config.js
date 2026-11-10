// ============================================================
//  CONFIG CENTRALE — coordonnées, réseaux, prise de RDV, infos légales.
//  Les valeurs de contact et légales sont AUSSI écrites en dur dans le
//  HTML (SEO, fonctionnement sans JS), repérées par <!-- SYNC config.js -->.
//  Si vous modifiez une valeur ici, modifiez-la aussi dans le HTML.
//  Toute valeur commençant par TODO_ reste à renseigner.
// ============================================================
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
  booking: { provider: "interne", lien: "", dureeMin: 20 }, // "interne" = agenda du site (horaires : server/disponibilites.js) · "cal" | "calendly" + lien
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

// Liens dérivés, utilisés par booking.js, contact-fab.js et site.js
export const LIENS = {
  tel: `tel:${SITE.telephoneLien}`,
  whatsapp: `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(SITE.whatsappMessage)}`,
  email: `mailto:${SITE.email}`,
  instagram: SITE.instagram ? `https://instagram.com/${SITE.instagram}` : "",
  instagramDM: SITE.instagram ? `https://ig.me/m/${SITE.instagram}` : "",
  tiktok: SITE.tiktok ? `https://www.tiktok.com/@${SITE.tiktok}` : "",
  linkedin: SITE.linkedin || "",
};
