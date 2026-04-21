/**
 * uiRenderer.js
 * Pure rendering functions — takes data, returns HTML or mutates DOM.
 */

const MODE_COLOR = {
  WALK:   '#888780',
  BUS:    '#007ac9',
  TRAM:   '#009950',
  SUBWAY: '#ff5a1e',
  RAIL:   '#8c4799',
  FERRY:  '#007ac9',
};

const MODE_LABEL = {
  WALK:   'Kävely',
  BUS:    'Bussi',
  TRAM:   'Ratikka',
  SUBWAY: 'Metro',
  RAIL:   'Juna',
  FERRY:  'Lautta',
};

/** @param {number} secs @returns {string} */
function formatDuration(secs) {
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/** @param {number} ms @returns {string} */
function formatTime(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** @param {Object} itin @param {number} index @returns {string} */
function renderItinerary(itin, index) {
  const totalMins = Math.round(itin.duration / 60);
  const startTime = formatTime(itin.legs[0].startTime);
  const endTime   = formatTime(itin.legs[itin.legs.length - 1].endTime);
  const walkKm    = (itin.walkDistance / 1000).toFixed(1);

  const fastestBadge = index === 0
    ? `<span style="background:rgba(232,71,42,0.12);color:var(--accent);font-size:0.68rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:3px">NOPEIN</span>`
    : '';

  const pills = itin.legs.map(leg => {
    const color = MODE_COLOR[leg.mode] || '#888';
    const label = leg.mode === 'WALK'
      ? `🚶 ${Math.round(leg.duration / 60)} min`
      : (leg.route?.shortName || MODE_LABEL[leg.mode] || leg.mode);
    return `<span style="background:${color}25;color:${color};border:1px solid{color}60;font-size:0.72rem;font-weight:700;padding:0.2rem 0.55rem;border-radius:4px;white-space:nowrap">${label}</span>`;
  }).join(`<span style="color:var(--text2);font-size:0.75rem;padding:0 2px">›</span>`);

  const steps = itin.legs.map(leg => {
    const color    = MODE_COLOR[leg.mode] || '#888';
    const modeName = MODE_LABEL[leg.mode] || leg.mode;
    const dur      = formatDuration(leg.duration);
    const detail   = leg.mode === 'WALK'
      ? `Kävele ${Math.round(leg.distance)} m → ${leg.to.name}`
      : `${modeName}${leg.route?.shortName ? ` ${leg.route.shortName}` : ''} → ${leg.to.name}`;

    return `
      <div style="display:flex;align-items:flex-start;gap:0.6rem;padding:0.5rem 0;border-bottom:1px solid var(--border)">
        <span style="background:${color}20;color:${color};font-size:0.68rem;font-weight:700;padding:0.15rem 0.45rem;border-radius:3px;flex-shrink:0;margin-top:2px">${modeName}</span>
        <span style="flex:1;font-size:0.83rem;color:var(--text2);line-height:1.4">${detail}</span>
        <span style="font-size:0.78rem;color:var(--text2);white-space:nowrap">${dur}</span>
      </div>`;
  }).join('');

  return `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:0.75rem">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;padding:0.85rem 1rem;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:0.6rem">
          <span style="font-size:1.1rem;font-weight:600">${totalMins} min</span>
          ${fastestBadge}
          <span style="font-size:0.75rem;color:var(--text2)">${startTime} – ${endTime} · kävely ${walkKm} km</span>
        </div>
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:0.3rem">${pills}</div>
      </div>
      <div style="padding:0.25rem 1rem 0.5rem">${steps}</div>
    </div>`;
}

/** @param {HTMLElement} el */
function showSpinner(el) {
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:3rem 1rem;color:var(--text2)">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style="animation:hsl-spin 0.9s linear infinite">
        <circle cx="18" cy="18" r="15" stroke="var(--border)" stroke-width="3"/>
        <path d="M18 3 A15 15 0 0 1 33 18" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
      </svg>
      <span style="font-size:0.9rem">Haetaan reittiä…</span>
    </div>
    <style>@keyframes hsl-spin { to { transform: rotate(360deg); } }</style>`;
}

/** @param {HTMLElement} el */
function showNoRoutes(el) {
  el.innerHTML = `
    <div style="text-align:center;padding:2.5rem 1rem;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius)">
      <div style="font-size:2.5rem;margin-bottom:0.75rem">🗺️</div>
      <div style="font-weight:500;margin-bottom:0.4rem">Reittejä ei löytynyt</div>
      <div style="font-size:0.85rem;color:var(--text2)">Oletko HSL-alueella?</div>
    </div>`;
}

/** @param {HTMLElement} el @param {string} msg */
function showError(el, msg) {
  el.innerHTML = `
    <div style="background:rgba(232,71,42,0.07);border:1px solid rgba(232,71,42,0.2);border-radius:var(--radius);padding:1rem 1.25rem;color:var(--text2);font-size:0.85rem;display:flex;align-items:flex-start;gap:0.6rem">
      <span style="flex-shrink:0">⚠️</span>
      <span>${msg}</span>
    </div>`;
}

/** @param {HTMLElement} el @param {Object[]} itineraries */
function showItineraries(el, itineraries) {
  el.innerHTML = itineraries.map(renderItinerary).join('');
}

export { showSpinner, showNoRoutes, showError, showItineraries };
