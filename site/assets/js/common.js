// ============================================================
//  COMMUN AUX PAGES PUBLIQUES (vitrine, rendez-vous, légal, 404)
//  - complète les liens de contact depuis config.js (le HTML contient déjà
//    les valeurs en dur pour le SEO et le fonctionnement sans JS) ;
//  - masque les réseaux non renseignés ;
//  - active la modale « Réserver un appel » (booking.js) ;
//  - menu mobile, header compact, révélation au scroll ;
//  - année courante dans le footer.
// ============================================================
(() => {
const { SITE, LIENS, realisations = [] } = MIRA;

// Pas encore de réalisation publiable → les liens « Réalisations » disparaissent aussi
// des pages sans carrousel (404, légal…). Sur la vitrine, sections.js retire en plus la section.
// Local = localhost, 127.0.0.1 ou fichier ouvert en double-clic (file://)
const IS_LOCAL = ['localhost', '127.0.0.1', ''].includes(location.hostname);
if (!realisations.some(r => r && (!r.demo || IS_LOCAL))) {
  document.querySelectorAll('a[href="#realisations"], a[href="index.html#realisations"], a[href="/#realisations"]').forEach(a => {
    const li = a.closest('li');
    (li && li.children.length === 1 ? li : a).remove();
  });
}

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

// ---- Menu mobile (header de la vitrine, réutilisé par la 404 et les pages légales) ----
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');
if (navToggle && mainNav) {
  const setMenu = (open) => {
    mainNav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.documentElement.classList.toggle('menu-open', open);
  };
  navToggle.addEventListener('click', () => setMenu(!mainNav.classList.contains('open')));
  mainNav.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav.classList.contains('open')) { setMenu(false); navToggle.focus(); }
  });
  // Repasse en desktop : le menu ouvert ne doit pas bloquer le défilement
  window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
}

// ---- Header compact au scroll ----
const siteHeader = document.getElementById('site-header');
if (siteHeader) {
  let ticking = false;
  const onScroll = () => { siteHeader.classList.toggle('is-scrolled', window.scrollY > 40); ticking = false; };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
}

// ---- Révélation discrète au scroll ----
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
