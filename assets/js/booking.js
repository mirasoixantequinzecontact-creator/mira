// ============================================================
//  MODALE DE PRISE DE RDV — « Réserver un appel / 20 min, gratuit. »
//
//  - Tout élément [data-open-booking] ouvre la modale ; data-pack="Mira Essentiel"
//    pré-remplit les notes de la réservation (« Intéressé par : Mira Essentiel »).
//  - Agenda Cal.com (ou Calendly) en inline, chargé À LA PREMIÈRE OUVERTURE
//    seulement : aucune requête vers un tiers au chargement de la page.
//  - Lien encore en TODO_ ou script en échec → repli : téléphone, WhatsApp,
//    formulaire « être rappelé ». Jamais de modale vide, jamais de redirection.
//  - Accessibilité : role="dialog", aria-modal, focus piégé, Esc, retour du focus.
// ============================================================
import { SITE, LIENS } from './config.js';

const { provider = 'cal', lien = '', dureeMin = 20 } = SITE.booking || {};
const LIEN_OK = lien && !/^TODO/i.test(lien);
const LOAD_TIMEOUT = 12000;

let modal, panel, embedBox, fallback, loading, packTag, closeBtn, opener;
let scriptPromise = null;
let currentReady = () => {};  // rappel « agenda prêt » de l'ouverture en cours

// ---- Construction de la modale (une seule fois, à la première ouverture) ----
function svgM() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'booking-m');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', '18.5 25.7 392.7 392.7');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#m-italique');
  svg.append(use);
  return svg;
}

function build() {
  modal = document.createElement('div');
  modal.className = 'booking';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="booking-panel" role="dialog" aria-modal="true" aria-labelledby="booking-title" tabindex="-1">
      <div class="booking-head">
        <div class="booking-titles">
          <h2 id="booking-title" class="booking-title">Réserver un appel <span class="light">${dureeMin} min, gratuit.</span></h2>
          <span class="tag booking-pack" hidden></span>
        </div>
        <button type="button" class="booking-close" aria-label="Fermer la prise de rendez-vous">×</button>
      </div>
      <div class="booking-body">
        <p class="booking-loading" role="status">Chargement de l'agenda…</p>
        <div class="booking-embed" id="booking-embed"></div>
        <div class="booking-fallback" hidden>
          <p class="booking-fallback-title">Réservez par téléphone ou laissez-nous vos coordonnées.</p>
          <div class="booking-fallback-actions">
            <a class="btn-primary" data-contact="tel"></a>
            <a class="btn-ghost" data-contact="whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a class="btn-ghost" href="/rendez-vous.html">Être rappelé</a>
          </div>
        </div>
      </div>
    </div>`;
  document.body.append(modal);
  panel = modal.querySelector('.booking-panel');
  panel.querySelector('.booking-head').prepend(svgM());
  embedBox = modal.querySelector('.booking-embed');
  fallback = modal.querySelector('.booking-fallback');
  loading = modal.querySelector('.booking-loading');
  packTag = modal.querySelector('.booking-pack');
  closeBtn = modal.querySelector('.booking-close');

  const tel = fallback.querySelector('[data-contact="tel"]');
  tel.href = LIENS.tel;
  tel.textContent = `Appeler le ${SITE.telephoneAffiche}`;
  fallback.querySelector('[data-contact="whatsapp"]').href = LIENS.whatsapp;

  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  modal.addEventListener('keydown', onKeydown);
}

function focusables() {
  return [...panel.querySelectorAll('a[href], button:not([disabled]), iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter(n => !n.closest('[hidden]'));
}
function onKeydown(e) {
  if (e.key === 'Escape') { e.preventDefault(); close(); return; }
  if (e.key !== 'Tab') return;
  const f = focusables();
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// ---- Ouverture / fermeture ----
function open(pack, from) {
  if (!modal) build();
  opener = from || document.activeElement;
  if (pack) {
    packTag.replaceChildren('Intéressé par : ', brandName(pack));
    packTag.hidden = false;
  } else {
    packTag.hidden = true;
  }
  modal.hidden = false;
  document.documentElement.classList.add('modal-open');
  closeBtn.focus();
  document.dispatchEvent(new CustomEvent('mira:booking-open', { detail: { pack } }));
  render(pack);
}
function close() {
  modal.hidden = true;
  document.documentElement.classList.remove('modal-open');
  opener?.focus?.();
}

// « Mira Essentiel » → « mira Essentiel » avec le m en italique (charte de marque)
function brandName(pack) {
  const frag = document.createDocumentFragment();
  const m = /^Mira\b\s*(.*)$/.exec(pack);
  if (!m) { frag.append(pack); return frag; }
  const brand = document.createElement('span');
  brand.className = 'brand';
  const em = document.createElement('em');
  em.textContent = 'm';
  brand.append(em, 'ira');
  frag.append(brand, m[1] ? ' ' + m[1] : '');
  return frag;
}

function showFallback() {
  loading.hidden = true;
  embedBox.hidden = true;
  fallback.hidden = false;
}

// ---- Agenda ----
function render(pack) {
  if (!LIEN_OK) { showFallback(); return; }
  const notes = pack ? `Intéressé par : ${pack}` : '';
  fallback.hidden = true;
  embedBox.hidden = false;
  embedBox.replaceChildren();
  loading.hidden = false;
  let isReady = false;
  const timer = setTimeout(() => { if (!isReady) showFallback(); }, LOAD_TIMEOUT);
  const ready = () => { isReady = true; clearTimeout(timer); loading.hidden = true; };
  currentReady = ready;
  (provider === 'calendly' ? renderCalendly(notes, ready) : renderCal(notes, ready))
    .catch(() => { clearTimeout(timer); showFallback(); });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = resolve; s.onerror = reject;
    document.head.append(s);
  });
}

// Cal.com — snippet officiel, mais le script est chargé par nous (pour détecter l'échec)
function calStub() {
  if (window.Cal) return;
  const Cal = function () {
    const ar = arguments;
    if (ar[0] === 'init' && typeof ar[1] === 'string') {
      const api = function () { api.q.push(arguments); };
      api.q = [];
      Cal.ns[ar[1]] = Cal.ns[ar[1]] || api;
      Cal.ns[ar[1]].q.push(ar);
      Cal.q.push(['initNamespace', ar[1]]);
      return;
    }
    Cal.q.push(ar);
  };
  Cal.ns = {}; Cal.q = []; Cal.loaded = true;
  window.Cal = Cal;
}
async function renderCal(notes, ready) {
  calStub();
  if (!scriptPromise) {
    window.Cal('init', 'mira', { origin: 'https://app.cal.com' });
    window.Cal.ns.mira('ui', { theme: 'light', cssVarsPerTheme: { light: { 'cal-brand': '#0a0a0a' } }, hideEventTypeDetails: false, layout: 'month_view' });
    // Écouteurs enregistrés une seule fois : ils appellent le rappel de l'ouverture en cours
    window.Cal.ns.mira('on', { action: 'linkReady', callback: () => currentReady() });
    window.Cal.ns.mira('on', { action: 'linkFailed', callback: showFallback });
    scriptPromise = loadScript('https://app.cal.com/embed/embed.js');
  }
  const calLink = lien.replace(/^https?:\/\/(app\.)?cal\.com\//, '').replace(/^\/+/, '');
  window.Cal.ns.mira('inline', {
    elementOrSelector: '#booking-embed',
    calLink,
    config: { layout: 'month_view', theme: 'light', ...(notes ? { notes } : {}) },
  });
  await scriptPromise;
}

// Calendly — widget inline officiel
async function renderCalendly(notes, ready) {
  if (!scriptPromise) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.append(css);
    scriptPromise = loadScript('https://assets.calendly.com/assets/external/widget.js');
  }
  await scriptPromise;
  window.Calendly.initInlineWidget({
    url: lien + (lien.includes('?') ? '&' : '?') + 'hide_gdpr_banner=1&primary_color=0a0a0a',
    parentElement: embedBox,
    prefill: notes ? { customAnswers: { a1: notes } } : {},
  });
  ready();
}

// ---- Déclencheurs (délégation : marche aussi pour les boutons ajoutés plus tard) ----
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-open-booking]');
  if (!trigger) return;
  e.preventDefault();
  open(trigger.dataset.pack || '', trigger);
});

export { open as openBooking };
