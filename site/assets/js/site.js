// ============================================================
//  VITRINE — entrée du hero, scrollspy, copie de l'e-mail, showreel.
//  Menu mobile, header compact et révélation au scroll : common.js.
//  Module ES : chargé avec <script type="module">, donc après le HTML.
// ============================================================
(() => {
// Chargé en dernier (voir l'ordre des <script> dans index.html) :
// les sections sont déjà rendues (et les vides retirées) avant le scrollspy.
const { SITE } = MIRA;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Entrée animée du titre du hero (puis l'œil, en CSS) ----
requestAnimationFrame(() => document.body.classList.add('is-loaded'));

// ---- Mise en avant de la section active dans la nav (scrollspy) ----
// Lancé après le rendu des sections (sections.js retire les sections vides et leurs liens).
function initScrollspy() {
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
function showToast(message) {
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
  fetch('videos/showreel.mp4', { method: 'HEAD' }).then((res) => {
    if (!res.ok) return;
    const video = ambianceVideo.querySelector('video');
    video.poster = video.dataset.poster; // poster obligatoire, chargé seulement si le showreel existe
    document.querySelector('.ambiance-photos').hidden = true;
    ambianceVideo.hidden = false;
    // Chargé seulement à l'approche de l'écran ; immobile si l'utilisateur réduit les animations
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      video.src = 'videos/showreel.mp4';
      if (!reduceMotion) video.play().catch(() => {});
    }, { rootMargin: '200px' });
    io.observe(ambianceVideo);
  }).catch(() => {});
}

initScrollspy();

// ---- Agenda de réservation dans la section contact ----
// Monté à l'approche de la section (aucune requête au chargement de la page).
// Avec Cal.com ou Calendly (config.js), un bouton ouvre la modale à la place.
const agendaBox = document.querySelector('[data-agenda]');
if (agendaBox) {
  if ((SITE.booking?.provider || 'interne') !== 'interne') {
    agendaBox.innerHTML = '<button type="button" class="btn-light contact-cta" data-open-booking>Réserver un appel de 20 min</button>';
    agendaBox.classList.remove('contact-agenda');
  } else {
    const mount = () => MIRA.mountAgenda(agendaBox);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { io.disconnect(); mount(); }
      }, { rootMargin: '800px 0px' });
      io.observe(agendaBox);
    } else mount();
  }
}
})();
