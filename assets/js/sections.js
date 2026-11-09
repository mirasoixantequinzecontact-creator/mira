// ============================================================
//  SECTIONS ALIMENTÉES PAR LES DONNÉES — assets/data/*.js
//  Réalisations, avant/après, clients, résultats, témoignages.
//
//  Règles :
//   - tableau vide → la section ET les liens qui y mènent sont retirés du DOM ;
//   - les entrées demo: true ne s'affichent qu'en local (localhost / 127.0.0.1) ;
//   - les réponses de FAQ marquées data-todo ne s'affichent qu'en local.
//  Tout est construit avec textContent : aucune donnée n'est injectée en HTML.
// ============================================================
import realisations from '../data/realisations.js';
import avantApres from '../data/avantApres.js';
import clients from '../data/clients.js';
import resultats from '../data/resultats.js';
import temoignages from '../data/temoignages.js';

const IS_LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const visible = (list) => (Array.isArray(list) ? list : []).filter(e => e && (!e.demo || IS_LOCAL));

// ---- Petits utilitaires DOM ----
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  children.flat().forEach(c => c != null && node.append(c));
  return node;
}
function signature() {
  // « m » italique : signature de réalisateur en bas à droite de chaque vidéo
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'video-sign');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#m-italique');
  svg.append(use);
  return svg;
}

// Retire une section et tous les liens qui y mènent (nav, footer, boutons du hero…)
function removeSection(id) {
  document.getElementById(id)?.remove();
  document.querySelectorAll(`a[href="#${id}"], a[href="/#${id}"]`).forEach(a => {
    const li = a.closest('li');
    (li && li.querySelector('a') === a && li.children.length === 1 ? li : a).remove();
  });
}
const show = (id) => { const s = document.getElementById(id); if (s) s.hidden = false; };

// ============================================================
//  LIGHTBOX — vidéo complète avec le son (Esc, croix, swipe vers le bas)
// ============================================================
let lightbox, lbVideo, lbCaption, lbClose, lbOpener;
function ensureLightbox() {
  if (lightbox) return;
  lbClose = el('button', { type: 'button', class: 'lightbox-close', 'aria-label': 'Fermer la vidéo', text: '×' });
  lbVideo = el('video', { controls: true, playsinline: true, preload: 'none' });
  lbCaption = el('p', { class: 'lightbox-caption', id: 'lightbox-caption' });
  lightbox = el('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'lightbox-caption', hidden: true },
    lbClose, lbVideo, lbCaption);
  document.body.append(lightbox);

  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
    if (e.key === 'Tab') {
      // Focus piégé : la croix et les contrôles de la vidéo
      const f = [lbClose, lbVideo];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  // Swipe vers le bas pour fermer (mobile)
  let startY = null;
  lightbox.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (startY !== null && e.changedTouches[0].clientY - startY > 80) closeLightbox();
    startY = null;
  });
}
function openLightbox(item, opener) {
  ensureLightbox();
  lbOpener = opener;
  lbVideo.poster = item.poster || '';
  lbVideo.src = item.video;
  lbCaption.textContent = [item.client, item.lieu, item.format].filter(Boolean).join(' · ');
  lightbox.hidden = false;
  document.documentElement.classList.add('modal-open');
  lbClose.focus();
  lbVideo.play().catch(() => {});
}
function closeLightbox() {
  lbVideo.pause();
  lbVideo.removeAttribute('src'); // arrête le téléchargement
  lbVideo.load();
  lightbox.hidden = true;
  document.documentElement.classList.remove('modal-open');
  lbOpener?.focus();
}

// ============================================================
//  CARTES VIDÉO 9:16 (réalisations et témoignages)
// ============================================================
// L'aperçu muet ne se charge et ne joue que lorsque la carte est visible
const previewObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    const video = target.querySelector('video');
    if (!video) return;
    if (isIntersecting) {
      if (!video.src) video.src = video.dataset.src;
      if (!reduceMotion) video.play().then(() => target.classList.add('is-playing')).catch(() => {});
    } else if (video.src) {
      video.pause();
    }
  });
}, { threshold: 0.6 }) : null;

function videoCard(item, { withPreview, quote } = {}) {
  const label = `Voir la vidéo ${[item.client, item.lieu].filter(Boolean).join(', ')} en plein écran, avec le son`;
  const card = el('button', { type: 'button', class: 'video-card', 'aria-label': label },
    el('img', { src: item.poster, alt: '', loading: 'lazy', decoding: 'async' }),
    withPreview && item.preview ? el('video', { muted: true, loop: true, playsinline: true, preload: 'none', 'data-src': item.preview, 'aria-hidden': 'true' }) : null,
    el('span', { class: 'video-play', 'aria-hidden': 'true', text: '▶ Voir' }),
    signature());
  const video = card.querySelector('video');
  if (video) { video.muted = true; previewObserver?.observe(card); }
  card.addEventListener('click', () => openLightbox(item, card));

  const meta = quote
    ? el('div', { class: 'video-meta' },
        el('p', { class: 'video-quote', text: `« ${item.citationCourte} »` }),
        el('strong', { text: item.nom }),
        el('span', { text: [item.role, item.client].filter(Boolean).join(' — ') }))
    : el('div', { class: 'video-meta' },
        el('strong', { text: item.client }),
        el('span', { text: [item.lieu, item.format].filter(Boolean).join(' · ') }),
        item.instagramUrl ? el('a', { href: item.instagramUrl, target: '_blank', rel: 'noopener noreferrer', class: 'video-insta', text: 'Voir sur Instagram' }) : null);
  return el('li', { class: 'carousel-item' }, card, meta);
}

// Flèches desktop : défilement d'environ une largeur d'écran, désactivées aux extrémités
function initCarousel(carousel) {
  const track = carousel.querySelector('.carousel-track');
  const [prev, next] = carousel.querySelectorAll('.carousel-arrow');
  if (!track || !prev || !next) return;
  const update = () => {
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };
  [prev, next].forEach(btn => btn.addEventListener('click', () => {
    track.scrollBy({ left: Number(btn.dataset.dir) * track.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));
  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  update();
}

// ============================================================
//  RENDUS
// ============================================================
function renderRealisations() {
  const items = visible(realisations);
  if (!items.length) return removeSection('realisations');
  const track = document.querySelector('[data-render="realisations"]');
  items.forEach(item => track.append(videoCard(item, { withPreview: true })));
  show('realisations');
  initCarousel(track.closest('[data-carousel]'));
}

function renderAvantApres() {
  const items = visible(avantApres);
  if (!items.length) return removeSection('avant-apres');
  const list = document.querySelector('[data-render="avant-apres"]');
  items.forEach((item, i) => {
    const range = el('input', { type: 'range', min: '0', max: '100', value: '50', 'aria-label': `Comparer l'image brute et l'image étalonnée${items.length > 1 ? ' ' + (i + 1) : ''}` });
    const box = el('div', { class: 'compare' },
      el('img', { src: item.avant, alt: 'Image brute, avant étalonnage', loading: 'lazy', decoding: 'async' }),
      el('img', { class: 'compare-after', src: item.apres, alt: 'La même image après étalonnage', loading: 'lazy', decoding: 'async' }),
      el('span', { class: 'compare-label compare-label--before', text: 'Brut' }),
      el('span', { class: 'compare-label compare-label--after', text: 'Étalonné' }),
      el('span', { class: 'compare-handle', 'aria-hidden': 'true' }),
      range);
    const update = () => {
      box.style.setProperty('--pos', range.value + '%');
      range.setAttribute('aria-valuetext', `${range.value} % brut, ${100 - range.value} % étalonné`);
    };
    range.addEventListener('input', update);
    update();
    list.append(el('figure', { class: 'compare-item' }, box, item.legende ? el('figcaption', { class: 'compare-caption', text: item.legende }) : null));
  });
  show('avant-apres');
}

function renderClients() {
  const items = visible(clients);
  if (items.length < 4) return removeSection('clients');
  const track = document.querySelector('[data-render="clients"]');
  // Contenu dupliqué pour la boucle infinie ; la copie est ignorée par les lecteurs d'écran et le clavier
  [false, true].forEach(isCopy => items.forEach(c => {
    const img = el('img', { src: c.logo, alt: isCopy ? '' : c.nom, loading: 'lazy', decoding: 'async' });
    const inner = c.url
      ? el('a', { href: c.url, target: '_blank', rel: 'noopener noreferrer', tabindex: isCopy ? '-1' : null }, img)
      : el('span', {}, img);
    track.append(el('li', { 'aria-hidden': isCopy ? 'true' : null }, inner));
  }));
  show('clients');
}

function renderResultats() {
  const items = visible(resultats);
  if (!items.length) return removeSection('resultats');
  const grid = document.querySelector('[data-render="resultats"]');
  const nf = new Intl.NumberFormat('fr-FR');
  items.forEach(r => {
    const chiffre = el('p', { class: 'resultat-chiffre' });
    chiffre.append(nf.format(r.abonnesAvant), el('span', { class: 'light', text: ' → ' }), nf.format(r.abonnesApres), el('span', { class: 'light', text: ' abonnés' }));
    grid.append(el('article', { class: 'resultat' },
      el('span', { class: 'resultat-handle', text: `@${r.handle} — ${r.client}` }),
      chiffre,
      el('p', { class: 'resultat-periode', text: `en ${r.periode}` }),
      el('div', { class: 'resultat-captures' },
        el('figure', {}, el('img', { src: r.captureAvant, alt: `Capture du compte @${r.handle} avant`, loading: 'lazy' }), el('figcaption', { text: 'Avant' })),
        el('figure', {}, el('img', { src: r.captureApres, alt: `Capture du compte @${r.handle} après`, loading: 'lazy' }), el('figcaption', { text: 'Après' }))),
      el('p', { class: 'resultat-date', text: `Relevé : ${r.dateReleve}` })));
  });
  show('resultats');
}

function renderTemoignages() {
  const items = visible(temoignages);
  const reviews = document.querySelector('#temoignages .reviews-grid');
  const hasReviews = reviews && reviews.children.length > 0; // les modèles commentés ne comptent pas
  if (!items.length && !hasReviews) return removeSection('temoignages');
  const carousel = document.querySelector('#temoignages [data-carousel]');
  if (items.length) {
    const track = carousel.querySelector('[data-render="temoignages"]');
    items.forEach(item => track.append(videoCard(item, { quote: true })));
    initCarousel(carousel);
  } else {
    carousel.remove();
  }
  show('temoignages');
}

// FAQ : les réponses encore à compléter (TODO_) ne partent pas en ligne
function cleanFaq() {
  if (IS_LOCAL) return;
  document.querySelectorAll('.faq-list [data-todo]').forEach(d => d.remove());
  document.querySelectorAll('.faq-list .faq-num').forEach((n, i) => { n.textContent = String(i + 1).padStart(2, '0'); });
}

renderRealisations();
renderAvantApres();
renderClients();
renderResultats();
renderTemoignages();
cleanFaq();
