// ============================================================
//  AGENDA DE RÉSERVATION — directement sur le site, sans service tiers.
//  1. le visiteur choisit un jour puis une heure (créneaux libres : GET /api/creneaux) ;
//  2. il laisse ses coordonnées ;
//  3. le rendez-vous est enregistré (POST /api/rdv) et apparaît dans l'espace équipe.
//  Horaires proposés : server/disponibilites.js.
//  Utilisé par la modale « Réserver un appel » (booking.js) et la section contact.
// ============================================================
(() => {
const { SITE, LIENS } = MIRA;

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const fmtJour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const fmtMois = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const asDate = (iso) => new Date(iso + 'T00:00:00Z');
const jourLong = (iso) => fmtJour.format(asDate(iso));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

let uid = 0;

// Page ouverte en double-clic (file://) : pas de serveur. L'agenda s'affiche
// en aperçu avec des créneaux indicatifs, et l'envoi est désactivé.
const APERCU = location.protocol === 'file:';
function creneauxApercu() {
  const out = {};
  for (let i = 1; i <= 30; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out[iso] = ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
  }
  return out;
}

function mountAgenda(root, { pack = '' } = {}) {
  const id = `ag${++uid}`;
  let jours = {}, mois = '', choix = { date: '', heure: '' }, dureeMin = SITE.booking?.dureeMin || 20;

  root.classList.add('agenda');
  root.innerHTML = `
    <div class="agenda-pick">
      <div class="agenda-cal">
        <div class="agenda-month">
          <button type="button" class="agenda-nav" data-nav="-1" aria-label="Mois précédent">‹</button>
          <p class="agenda-month-label" aria-live="polite"></p>
          <button type="button" class="agenda-nav" data-nav="1" aria-label="Mois suivant">›</button>
        </div>
        <div class="agenda-grid">${JOURS.map(j => `<span class="agenda-dow" aria-hidden="true">${j}</span>`).join('')}</div>
      </div>
      <div class="agenda-slots">
        <p class="agenda-slots-title" aria-live="polite">Chargement des disponibilités…</p>
        <div class="agenda-times"></div>
        <p class="agenda-tz">Heure de Paris · appel de ${dureeMin} min</p>
      </div>
    </div>
    <form class="agenda-form" novalidate hidden>
      <div class="agenda-recap">
        <p><strong class="agenda-recap-when"></strong><span class="agenda-recap-dur"></span></p>
        <button type="button" class="agenda-link" data-back>Changer</button>
      </div>
      <div class="agenda-fields">
        <div class="agenda-field"><label for="${id}-prenom">Prénom *</label><input id="${id}-prenom" name="prenom" maxlength="80" autocomplete="given-name" required></div>
        <div class="agenda-field"><label for="${id}-nom">Nom *</label><input id="${id}-nom" name="nom" maxlength="80" autocomplete="family-name" required></div>
        <div class="agenda-field full"><label for="${id}-etab">Votre établissement *</label><input id="${id}-etab" name="etablissement" maxlength="120" autocomplete="organization" placeholder="Restaurant, bar, boutique…" required></div>
        <div class="agenda-field"><label for="${id}-tel">Téléphone *</label><input id="${id}-tel" name="telephone" type="tel" maxlength="30" autocomplete="tel" required></div>
        <div class="agenda-field"><label for="${id}-email">E-mail *</label><input id="${id}-email" name="email" type="email" maxlength="254" autocomplete="email" required></div>
        <div class="agenda-field full"><label for="${id}-msg">Un mot sur votre projet <span class="agenda-opt">(facultatif)</span></label><textarea id="${id}-msg" name="message" maxlength="1000" rows="3"></textarea></div>
        <div class="agenda-hp" aria-hidden="true"><label>Site web<input name="site_web" tabindex="-1" autocomplete="off"></label></div>
        <label class="agenda-consent full"><input type="checkbox" name="consent" required> J'accepte que ces informations soient utilisées pour organiser l'appel. <a href="confidentialite.html" target="_blank" rel="noopener">Confidentialité</a></label>
      </div>
      <p class="agenda-error" role="alert" hidden></p>
      <button type="submit" class="btn-primary agenda-submit">Confirmer le rendez-vous</button>
    </form>
    <div class="agenda-done" role="status" tabindex="-1" hidden></div>`;

  const $ = (s) => root.querySelector(s);
  const pick = $('.agenda-pick'), form = $('.agenda-form'), done = $('.agenda-done');
  const grid = $('.agenda-grid'), times = $('.agenda-times'), title = $('.agenda-slots-title');
  const label = $('.agenda-month-label'), err = $('.agenda-error'), submit = $('.agenda-submit');

  function show(step) {
    pick.hidden = step !== pick; form.hidden = step !== form; done.hidden = step !== done;
  }

  function moisDispo() { return [...new Set(Object.keys(jours).map(d => d.slice(0, 7)))]; }

  function renderMonth() {
    const ms = moisDispo();
    label.textContent = cap(fmtMois.format(asDate(mois + '-01')));
    root.querySelector('[data-nav="-1"]').disabled = mois <= ms[0];
    root.querySelector('[data-nav="1"]').disabled = mois >= ms[ms.length - 1];
    grid.querySelectorAll('.agenda-day, .agenda-pad').forEach(n => n.remove());
    const first = asDate(mois + '-01');
    const pad = (first.getUTCDay() + 6) % 7;                       // lundi = 0
    for (let i = 0; i < pad; i++) grid.insertAdjacentHTML('beforeend', '<span class="agenda-pad"></span>');
    const nb = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    for (let d = 1; d <= nb; d++) {
      const iso = `${mois}-${String(d).padStart(2, '0')}`;
      const n = (jours[iso] || []).length;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'agenda-day'; b.textContent = d; b.dataset.date = iso;
      b.disabled = !n;
      b.setAttribute('aria-label', `${jourLong(iso)}${n ? `, ${n} créneau${n > 1 ? 'x' : ''}` : ', complet ou fermé'}`);
      b.setAttribute('aria-pressed', String(iso === choix.date));
      grid.append(b);
    }
  }

  function renderTimes() {
    times.replaceChildren();
    if (!choix.date) { title.textContent = 'Choisissez une date'; return; }
    title.textContent = cap(jourLong(choix.date));
    for (const h of jours[choix.date] || []) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'agenda-time'; b.textContent = h.replace(':', 'h'); b.dataset.heure = h;
      b.setAttribute('aria-label', `${jourLong(choix.date)} à ${h.replace(':', ' h ')}`);
      times.append(b);
    }
  }

  function selectDate(iso) {
    choix.date = iso;
    grid.querySelectorAll('.agenda-day').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.date === iso)));
    renderTimes();
  }

  function unavailable() {
    title.textContent = 'L’agenda est indisponible pour le moment.';
    times.innerHTML = `<p class="agenda-fallback">Appelez-nous au <a href="${LIENS.tel}">${SITE.telephoneAffiche}</a>
      ou écrivez-nous sur <a href="${LIENS.whatsapp}" target="_blank" rel="noopener noreferrer">WhatsApp</a>.</p>`;
    $('.agenda-cal').hidden = true;
  }

  async function load(keepDate) {
    try {
      if (APERCU) jours = creneauxApercu();
      else {
        const res = await fetch('/api/creneaux', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error();
        const data = await res.json();
        jours = data.jours || {}; dureeMin = data.dureeMin || dureeMin;
      }
    } catch (_) { unavailable(); return; }
    const dates = Object.keys(jours);
    if (!dates.length) {
      $('.agenda-cal').hidden = true;
      title.textContent = 'Plus aucun créneau libre pour le moment.';
      times.innerHTML = `<p class="agenda-fallback">Appelez-nous au <a href="${LIENS.tel}">${SITE.telephoneAffiche}</a> ou <a href="rendez-vous.html">demandez à être rappelé</a>.</p>`;
      return;
    }
    $('.agenda-cal').hidden = false;
    const date = keepDate && jours[keepDate] ? keepDate : dates[0];
    mois = date.slice(0, 7);
    renderMonth();
    selectDate(date);
  }

  root.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      const ms = moisDispo();
      mois = ms[Math.max(0, Math.min(ms.length - 1, ms.indexOf(mois) + Number(nav.dataset.nav)))];
      renderMonth();
      const firstOfMonth = Object.keys(jours).find(d => d.startsWith(mois));
      if (!choix.date.startsWith(mois) && firstOfMonth) selectDate(firstOfMonth);
      return;
    }
    const day = e.target.closest('.agenda-day');
    if (day && !day.disabled) { selectDate(day.dataset.date); times.querySelector('button')?.focus(); return; }
    const t = e.target.closest('.agenda-time');
    if (t) {
      choix.heure = t.dataset.heure;
      $('.agenda-recap-when').textContent = `${cap(jourLong(choix.date))} à ${choix.heure.replace(':', 'h')}`;
      $('.agenda-recap-dur').textContent = ` · ${dureeMin} min`;
      err.hidden = true;
      show(form);
      form.querySelector('input').focus();
      return;
    }
    if (e.target.closest('[data-back]')) { show(pick); times.querySelector(`[data-heure="${choix.heure}"]`)?.focus(); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.classList.add('submitted');
    if (!form.checkValidity()) {
      err.textContent = 'Merci de remplir les champs marqués d’une étoile et d’accepter l’utilisation de vos informations.';
      err.hidden = false;
      form.querySelector(':invalid')?.focus();
      return;
    }
    if (APERCU) {
      err.textContent = 'Aperçu hors ligne : lancez le site avec le serveur (npm start) pour réserver.';
      err.hidden = false;
      return;
    }
    const body = Object.fromEntries(new FormData(form));
    Object.assign(body, { consent: form.consent.checked, date: choix.date, heure: choix.heure, pack });
    submit.disabled = true; submit.textContent = 'Envoi…';
    try {
      const res = await fetch('/api/rdv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        await load(choix.date);
        show(pick);
        title.textContent = data.error || 'Ce créneau n’est plus disponible.';
        return;
      }
      if (!res.ok) throw new Error(data.error);
      showDone(body);
    } catch (ex) {
      const msg = ex instanceof TypeError ? '' : ex.message;   // TypeError = réseau
      err.innerHTML = '';
      err.append(msg || 'Envoi impossible pour le moment. ');
      if (!msg) err.insertAdjacentHTML('beforeend', `Appelez-nous au <a href="${LIENS.tel}">${SITE.telephoneAffiche}</a>.`);
      err.hidden = false;
    } finally {
      submit.disabled = false; submit.textContent = 'Confirmer le rendez-vous';
    }
  });

  function showDone(b) {
    const when = `${cap(jourLong(choix.date))} à ${choix.heure.replace(':', 'h')}`;
    done.innerHTML = `
      <p class="agenda-done-kicker">Rendez-vous confirmé</p>
      <p class="agenda-done-title">C'est noté, ${escapeHtml(b.prenom)}.</p>
      <p class="agenda-done-when">${when} · ${dureeMin} min</p>
      <p>On vous appelle au <strong>${escapeHtml(b.telephone)}</strong>. Un empêchement ? Prévenez-nous au <a href="${LIENS.tel}">${SITE.telephoneAffiche}</a>.</p>
      <a class="btn-ghost agenda-ics" download="appel-mira.ics">Ajouter à mon agenda</a>`;
    done.querySelector('.agenda-ics').href = icsUrl(choix.date, choix.heure, dureeMin);
    show(done);
    done.focus();
  }

  load();
  return { reload: () => { show(pick); form.reset(); form.classList.remove('submitted'); return load(); } };
}

MIRA.mountAgenda = mountAgenda;

function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }

// Fichier .ics (heure de Paris) pour ajouter l'appel à son propre agenda
function icsUrl(date, heure, duree) {
  const start = date.replace(/-/g, '') + 'T' + heure.replace(':', '') + '00';
  const endMin = Number(heure.slice(0, 2)) * 60 + Number(heure.slice(3)) + duree;
  const end = date.replace(/-/g, '') + 'T' + String(Math.floor(endMin / 60)).padStart(2, '0') + String(endMin % 60).padStart(2, '0') + '00';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//mira//agenda//FR', 'BEGIN:VEVENT',
    `UID:${start}-${Date.now()}@mira`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=Europe/Paris:${start}`, `DTEND;TZID=Europe/Paris:${end}`,
    `SUMMARY:Appel avec mira (${duree} min)`, `DESCRIPTION:mira vous appelle. Contact : ${SITE.telephoneAffiche}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  return URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
}
})();
