// ============================================================
//  VITRINE — entrée du hero, scrollspy, copie de l'e-mail, showreel.
//  Menu mobile, header compact et révélation au scroll : common.js.
//  Module ES : chargé avec <script type="module">, donc après le HTML.
// ============================================================
import { SITE } from './config.js';
// Ordre voulu : les sections sont rendues (et les vides retirées) avant le scrollspy
import './common.js';
import './sections.js';
import './contact-fab.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Entrée animée du titre du hero (puis l'œil, en CSS) ----
requestAnimationFrame(() => document.body.classList.add('is-loaded'));

// ---- Mise en avant de la section active dans la nav (scrollspy) ----
// Lancé après le rendu des sections (sections.js retire les sections vides et leurs liens).
export function initScrollspy() {
  const mainNav = document.getElementById('main-nav');
  if (!mainNav) return;
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
    video.poster = video.dataset.poster; // poster obligatoire, chargé seulement si le showreel existe
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

initScrollspy();
