/**
 * uiRenderer.js
 * Renders HSL route data into DOM elements using CSS classes from style.css.
 * No inline styles here — all visual rules live in css/style.css (.hsl-*)
 */

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

/**
 * Build one itinerary card.
 * @param {Object} itin
 * @param {number} index  0 = fastest
 * @returns {string} HTML
 */
function renderItinerary(itin, index) {
  const totalMins = Math.round(itin.duration / 60);
  const startTime = formatTime(itin.legs[0].startTime);
  const endTime   = formatTime(itin.legs[itin.legs.length - 1].endTime);
  const walkKm    = (itin.walkDistance / 1000).toFixed(1);

  const fastestBadge = index === 0
    ? `<span class="hsl-fastest">NOPEIN</span>`
    : '';

  const pills = itin.legs.map(leg => {
    const label = leg.mode === 'WALK'
      ? `🚶 ${Math.round(leg.duration / 60)} min`
      : (leg.route?.shortName || MODE_LABEL[leg.mode] || leg.mode);
    return `<span class="hsl-pill" data-mode="${leg.mode}">${label}</span>`;
  }).join(`<span class="hsl-pill-sep">›</span>`);

  const steps = itin.legs.map(leg => {
    const modeName = MODE_LABEL[leg.mode] || leg.mode;
    const detail   = leg.mode === 'WALK'
      ? `Kävele ${Math.round(leg.distance)} m → ${leg.to.name}`
      : `${modeName}${leg.route?.shortName ? ` ${leg.route.shortName}` : ''} → ${leg.to.name}`;

    return `
      <div class="hsl-step">
        <span class="hsl-step-mode" data-mode="${leg.mode}">${modeName}</span>
        <span class="hsl-step-detail">${detail}</span>
        <span class="hsl-step-dur">${formatDuration(leg.duration)}</span>
      </div>`;
  }).join('');

  return `
    <div class="hsl-card">
      <div class="hsl-card-header">
        <div class="hsl-card-meta">
          <span class="hsl-duration">${totalMins} min</span>
          ${fastestBadge}
          <span class="hsl-times">${startTime} – ${endTime} · kävely ${walkKm} km</span>
        </div>
        <div class="hsl-pills">${pills}</div>
      </div>
      <div class="hsl-steps">${steps}</div>
    </div>`;
}

/** @param {HTMLElement} el */
function showSpinner(el) {
  el.innerHTML = `
    <div class="hsl-spinner">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="15" stroke="var(--border)" stroke-width="3"/>
        <path d="M18 3 A15 15 0 0 1 33 18" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
      </svg>
      <span>Haetaan reittiä…</span>
    </div>`;
}

/** @param {HTMLElement} el */
function showNoRoutes(el) {
  el.innerHTML = `
    <div class="hsl-no-routes">
      <div class="hsl-no-routes-icon">🗺️</div>
      <div class="hsl-no-routes-title">Reittejä ei löytynyt</div>
      <div class="hsl-no-routes-sub">Oletko HSL-alueella?</div>
    </div>`;
}

/** @param {HTMLElement} el @param {string} msg */
function showError(el, msg) {
  el.innerHTML = `
    <div class="hsl-error">
      <span>⚠️</span>
      <span>${msg}</span>
    </div>`;
}

/** @param {HTMLElement} el @param {Object[]} itineraries */
function showItineraries(el, itineraries) {
  el.innerHTML = itineraries.map(renderItinerary).join('');
}

export { showSpinner, showNoRoutes, showError, showItineraries };
