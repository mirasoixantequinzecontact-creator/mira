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

// Caché quand le contact final ou le footer est à l'écran (ils proposent déjà tout)
const targets = [document.getElementById('contact'), document.querySelector('.site-footer')].filter(Boolean);
if ('IntersectionObserver' in window && targets.length) {
  const onScreen = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => (en.isIntersecting ? onScreen.add(en.target) : onScreen.delete(en.target)));
    const hide = onScreen.size > 0;
    root.classList.toggle('is-hidden', hide);
    toggle.tabIndex = hide ? -1 : 0;
    if (hide) setOpen(false);
  });
  targets.forEach(t => io.observe(t));
}
