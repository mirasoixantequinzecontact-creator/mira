// ============================================================
//  COMMUN AUX PAGES PUBLIQUES (vitrine, rendez-vous, légal, 404)
//  - complète les liens de contact depuis config.js (le HTML contient déjà
//    les valeurs en dur pour le SEO et le fonctionnement sans JS) ;
//  - masque les réseaux non renseignés ;
//  - active la modale « Réserver un appel » (booking.js) ;
//  - année courante dans le footer.
// ============================================================
import { SITE, LIENS } from './config.js';
import './booking.js';

// Liens de contact (data-contact="tel|whatsapp|email|instagram|instagramDM|tiktok")
document.querySelectorAll('[data-contact]').forEach(a => {
  const key = a.dataset.contact;
  const href = LIENS[key];
  if (href) a.href = href;
  if (key === 'tiktok' && SITE.tiktok) a.textContent = '@' + SITE.tiktok;
  // Réseau vide dans la config → la ligne disparaît (aucun lien mort)
  if (!href && ['instagram', 'instagramDM', 'tiktok'].includes(key)) (a.closest('li') || a).hidden = true;
});

// Réseaux du footer et du contact : visibles seulement s'ils sont renseignés
document.querySelectorAll('[data-social]').forEach(li => {
  const href = LIENS[li.dataset.social];
  li.hidden = !href;
  const a = li.querySelector('a');
  if (href && a) a.href = href;
});

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
