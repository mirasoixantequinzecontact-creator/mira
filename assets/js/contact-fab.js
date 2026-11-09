// ============================================================
//  BOUTON CONTACT FLOTTANT — rond noir 56px, icône bulle.
//  Pages : vitrine, mentions légales, confidentialité.
//  Panneau : Réserver un appel · WhatsApp · Appeler · Écrire sur Instagram.
//  Ne masque jamais le bas de page : il se cache dès que #contact ou le
//  footer est visible (et une marge est réservée en bas de page sur mobile).
// ============================================================
import { SITE, LIENS } from './config.js';

const BUBBLE = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4.4 21l3.9-1.9c1.2.4 2.4.6 3.7.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3Z"/></svg>';

const root = document.createElement('div');
root.className = 'contact-fab';
root.innerHTML = `
  <div class="fab-panel" id="fab-panel" hidden>
    <p class="fab-title">Parlons de votre lieu</p>
    <ul>
      <li><button type="button" data-open-booking>Réserver un appel</button></li>
      <li><a data-fab="whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
      <li><a data-fab="tel">Appeler</a></li>
      <li><a data-fab="instagramDM" target="_blank" rel="noopener noreferrer">Écrire sur Instagram</a></li>
    </ul>
  </div>
  <button type="button" class="fab-toggle" aria-expanded="false" aria-controls="fab-panel" aria-label="Nous contacter">${BUBBLE}</button>`;
document.body.append(root);
document.body.classList.add('has-fab');

const toggle = root.querySelector('.fab-toggle');
const panel = root.querySelector('.fab-panel');
root.querySelectorAll('[data-fab]').forEach(a => {
  const href = LIENS[a.dataset.fab];
  if (href) a.href = href; else a.closest('li').remove();
});
const telLink = root.querySelector('[data-fab="tel"]');
if (telLink) telLink.setAttribute('aria-label', `Appeler le ${SITE.telephoneAffiche}`);

function setOpen(open) {
  panel.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fermer le menu contact' : 'Nous contacter');
  if (open) panel.querySelector('a, button')?.focus();
}
toggle.addEventListener('click', () => setOpen(panel.hidden));
panel.addEventListener('click', (e) => { if (e.target.closest('a, button')) setOpen(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !panel.hidden) { setOpen(false); toggle.focus(); }
});
document.addEventListener('click', (e) => { if (!panel.hidden && !root.contains(e.target)) setOpen(false); });

// ---- Visibilité ----
// Le bouton se retire (fondu) quand :
//  1. le contact final ou le footer est à l'écran (ils proposent déjà tout) ;
//  2. à l'arrêt du défilement, il recouvrirait du texte ou un élément cliquable.
// Il réapparaît dès que la zone sous lui est libre : il ne masque jamais de contenu.
let nearEnd = false;
let covering = false;
function render() {
  const hide = nearEnd || (covering && panel.hidden);
  root.classList.toggle('is-hidden', hide);
  toggle.tabIndex = hide ? -1 : 0;
  if (nearEnd) setOpen(false);
}

const targets = [document.getElementById('contact'), document.querySelector('.site-footer')].filter(Boolean);
if ('IntersectionObserver' in window && targets.length) {
  const onScreen = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => (en.isIntersecting ? onScreen.add(en.target) : onScreen.delete(en.target)));
    nearEnd = onScreen.size > 0;
    render();
  });
  targets.forEach(t => io.observe(t));
}

// Y a-t-il du texte ou un élément cliquable sous le disque du bouton ?
const caretAt = document.caretPositionFromPoint
  ? (x, y) => { const c = document.caretPositionFromPoint(x, y); return c && { node: c.offsetNode, offset: c.offset }; }
  : document.caretRangeFromPoint
    ? (x, y) => { const r = document.caretRangeFromPoint(x, y); return r && { node: r.startContainer, offset: r.startOffset }; }
    : () => null;
function somethingUnder() {
  const r = toggle.getBoundingClientRect();
  if (!r.width) return false;
  root.style.pointerEvents = 'none';               // le hit-test « traverse » le bouton, sans repeindre
  try {
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width / 2 + 4;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const x = cx + (rad * i) / 2, y = cy + (rad * j) / 2;
      if (Math.hypot(x - cx, y - cy) > rad) continue;
      const el = document.elementFromPoint(x, y);
      if (!el) continue;
      if (el.closest('a, button, input, select, textarea, summary, label, [tabindex]')) return true;
      const c = caretAt(x, y);
      if (c && c.node && c.node.nodeType === 3 && c.node.textContent.trim()) {
        const range = document.createRange();
        const o = Math.min(c.offset, c.node.length - 1);
        if (o < 0) continue;
        range.setStart(c.node, o); range.setEnd(c.node, o + 1);
        const b = range.getBoundingClientRect();
        if (/\S/.test(range.toString()) && x >= b.left - 2 && x <= b.right + 2 && y >= b.top - 2 && y <= b.bottom + 2) return true;
      }
    }
    return false;
  } finally {
    root.style.pointerEvents = '';
  }
}
let scrollTimer;
function checkCover() { covering = somethingUnder(); render(); }
window.addEventListener('scroll', () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(checkCover, 120); }, { passive: true });
window.addEventListener('resize', () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(checkCover, 120); });
checkCover();
