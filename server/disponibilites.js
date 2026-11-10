// ============================================================
//  DISPONIBILITÉS — horaires proposés dans l'agenda de réservation du site.
//  Modifiez ce fichier puis redémarrez le serveur.
//  Toutes les heures sont à l'heure de Paris.
// ============================================================
module.exports = {
  dureeMin: 20,          // durée d'un appel (doit correspondre à SITE.booking.dureeMin dans assets/js/config.js)
  pauseMin: 10,          // battement entre deux appels → un créneau toutes les 30 min
  delaiMinHeures: 12,    // on ne peut pas réserver moins de 12 h à l'avance
  horizonJours: 30,      // on peut réserver jusqu'à 30 jours à l'avance

  // Plages ouvertes par jour de la semaine (1 = lundi … 6 = samedi, 0 = dimanche).
  // Un jour absent ou vide = fermé.
  plages: {
    1: [['10:00', '12:30'], ['14:00', '18:30']],
    2: [['10:00', '12:30'], ['14:00', '18:30']],
    3: [['10:00', '12:30'], ['14:00', '18:30']],
    4: [['10:00', '12:30'], ['14:00', '18:30']],
    5: [['10:00', '12:30'], ['14:00', '17:00']],
  },

  // Jours fermés exceptionnellement (congés, jours fériés) : 'AAAA-MM-JJ'
  fermetures: ['2026-11-11', '2026-12-25', '2027-01-01'],
};
