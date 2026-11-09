// ============================================================
//  VITRINE — menu mobile, révélation au scroll, header compact,
//  scrollspy, copie de l'e-mail, showreel, année.
//  Module ES : chargé avec <script type="module">, donc après le HTML.
// ============================================================
import { SITE } from './config.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Menu mobile ----
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');
function setMenu(open) {
  mainNav.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  document.documentElement.classList.toggle('menu-open', open);
}
navToggle.addEventListener('click', () => setMenu(!mainNav.classList.contains('open')));
mainNav.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mainNav.classList.contains('open')) { setMenu(false); navToggle.focus(); }
});
// Repasse en desktop : le menu ouvert ne doit pas bloquer le défilement
window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

// ---- Révélation discrète au scroll ----
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

// ---- Entrée animée du titre du hero (puis l'œil, en CSS) ----
requestAnimationFrame(() => document.body.classList.add('is-loaded'));

// ---- Header compact au scroll ----
const siteHeader = document.getElementById('site-header');
let ticking = false;
function onScroll() {
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
onScroll();

// ---- Mise en avant de la section active dans la nav (scrollspy) ----
// Lancé après le rendu des sections (sections.js retire les sections vides et leurs liens).
export function initScrollspy() {
  const navLinks = Array.from(mainNav.querySelectorAll('a[href^="#"]'));
  const spySections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window) || !spySections.length) return;
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = navLinks.find(l => l.getAttribute('href') === '#' + entry.target.id);
      if (link && entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('is-active'));
        link.classList.add('is-active');
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  spySections.forEach(section => spyObserver.observe(section));
}

// ---- Copier l'adresse e-mail ----
const toast = document.getElementById('toast');
let toastTimer;
export function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-shown');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 2200);
}
const copyBtn = document.getElementById('copy-email');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      showToast('Adresse copiée');
    } catch (err) {
      showToast('Copie indisponible — utilisez le lien');
    }
  });
}

// ---- Showreel : remplace les photos d'ambiance si /videos/showreel.mp4 existe ----
const ambianceVideo = document.querySelector('.ambiance-video');
if (ambianceVideo) {
  fetch('/videos/showreel.mp4', { method: 'HEAD' }).then((res) => {
    if (!res.ok) return;
    const video = ambianceVideo.querySelector('video');
    document.querySelector('.ambiance-photos').hidden = true;
    ambianceVideo.hidden = false;
    // Chargé seulement à l'approche de l'écran ; immobile si l'utilisateur réduit les animations
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      video.src = '/videos/showreel.mp4';
      if (!reduceMotion) video.play().catch(() => {});
    }, { rootMargin: '200px' });
    io.observe(ambianceVideo);
  }).catch(() => {});
}

// ---- Année courante dans le footer ----
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

initScrollspy();
