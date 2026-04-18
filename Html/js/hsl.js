/**
 * hsl.js
 * Fetches real-time HSL departure data for stops near Metro Pizza (Metropolia Bulevardi)
 * Uses Digitransit GraphQL API: https://api.digitransit.fi/routing/v2/hsl/gtfs/v1
 */

/** Nearby stops for Metropolia Bulevardi */
const STOPS = [
  { id: 'HSL:1040129', name: 'Iso Roobertinkatu', distance: '120 m', type: 'tram' },
  { id: 'HSL:1040131', name: 'Bulevardi',          distance: '200 m', type: 'tram' },
  { id: 'HSL:1020453', name: 'Eerikinkatu',         distance: '350 m', type: 'bus'  },
];

const HSL_API = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';

/**
 * Fetch next departures for a single stop via HSL GraphQL API
 * @param {string} stopId - HSL stop ID e.g. "HSL:1040129"
 * @returns {Promise<Object>} Raw API response
 */
async function fetchDepartures(stopId) {
  const query = `
    {
      stop(id: "${stopId}") {
        name
        stoptimesWithoutPatterns(numberOfDepartures: 4, omitCanceled: false) {
          scheduledDeparture
          realtimeDeparture
          realtime
          realtimeState
          headsign
          trip {
            route {
              shortName
              mode
            }
          }
        }
      }
    }
  `;

  const res = await fetch(HSL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`HSL API error: ${res.status}`);
  return res.json();
}

/**
 * Convert seconds-since-midnight to HH:MM string
 * @param {number} secs
 * @returns {string}
 */
function secsToTime(secs) {
  const h = Math.floor(secs / 3600) % 24;
  const m = Math.floor((secs % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Minutes until departure from current time
 * @param {number} depSecs - departure time in seconds since midnight
 * @returns {number}
 */
function minsUntil(depSecs) {
  const now = new Date();
  const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  return Math.round((depSecs - nowSecs) / 60);
}

/**
 * Build HTML for a single stop card with departures
 * @param {Object} stopMeta - entry from STOPS array
 * @param {Object} data - API response
 * @returns {string} HTML string
 */
function renderStop(stopMeta, data) {
  const stop = data?.data?.stop;
  if (!stop) return `<div class="error-state">Pysäkkitietoja ei saatavilla</div>`;

  const times = stop.stoptimesWithoutPatterns || [];

  const modeIcon  = { BUS: '🚌', TRAM: '🚋', SUBWAY: '🚇', RAIL: '🚆', FERRY: '⛴️' };
  const modeClass = { BUS: 'bus', TRAM: 'tram', SUBWAY: 'metro', RAIL: 'tram', FERRY: 'bus' };
  const routeClass = { BUS: 'route-bus', TRAM: 'route-tram', SUBWAY: 'route-metro', RAIL: 'route-tram', FERRY: 'route-bus' };

  const firstMode = times[0]?.trip?.route?.mode || stopMeta.type.toUpperCase();
  const icon      = modeIcon[firstMode] || '🚌';
  const iconClass = modeClass[firstMode] || stopMeta.type;

  const rows = times.map(t => {
    const depSecs = t.realtime ? t.realtimeDeparture : t.scheduledDeparture;
    const mins    = minsUntil(depSecs);
    const timeStr = secsToTime(depSecs);
    const mode    = t.trip?.route?.mode || firstMode;
    const rClass  = routeClass[mode] || 'route-bus';

    let timeDisplay;
    let timeClass = 'departure-time';

    if (mins <= 0) {
      timeDisplay = 'Nyt';
      timeClass  += ' soon';
    } else if (mins < 10) {
      timeDisplay = `${mins} min`;
      timeClass  += ' soon';
    } else {
      timeDisplay = timeStr;
      if (t.realtime) timeClass += ' realtime';
    }

    const realtimeDot = t.realtime ? '<span class="realtime-dot"></span>' : '';

    return `
      <div class="departure-row">
        <span class="route-badge ${rClass}">${t.trip?.route?.shortName || '?'}</span>
        <span class="departure-dest">${t.headsign || '–'}</span>
        ${realtimeDot}
        <span class="${timeClass}">${timeDisplay}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="stop-card">
      <div class="stop-card-header">
        <div class="stop-icon ${iconClass}">${icon}</div>
        <span class="stop-name">${stop.name}</span>
        <span class="stop-distance">${stopMeta.distance}</span>
      </div>
      <div class="departures">
        ${rows || '<div style="padding:0.75rem 1rem;color:var(--text2);font-size:0.85rem">Ei lähtöjä lähiaikoina</div>'}
      </div>
    </div>
  `;
}

/**
 * Load and render all stops — called on page load and on manual refresh
 */
async function loadDepartures() {
  const content = document.getElementById('hsl-content');
  const btn     = document.getElementById('refreshBtn');

  btn.classList.add('spinning');
  content.innerHTML = `
    <div class="loading-state">
      <div class="skeleton" style="height:80px"></div>
      <div class="skeleton" style="height:80px"></div>
      <div class="skeleton" style="height:80px"></div>
    </div>
  `;

  try {
    const results = await Promise.all(STOPS.map(s => fetchDepartures(s.id)));
    content.innerHTML = results.map((data, i) => renderStop(STOPS[i], data)).join('');

    const now = new Date();
    document.getElementById('lastUpdated').textContent =
      `Päivitetty ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  } catch (err) {
    content.innerHTML = `
      <div class="error-state">
        ⚠️ HSL-tietoja ei voitu ladata juuri nyt.<br>
        <button onclick="loadDepartures()" style="margin-top:0.5rem;background:transparent;border:1px solid var(--border);color:var(--text2);padding:0.35rem 0.9rem;border-radius:6px;cursor:pointer;font-family:inherit;font-size:0.82rem">
          Yritä uudelleen
        </button>
      </div>
    `;
  } finally {
    btn.classList.remove('spinning');
  }
}

// Initial load + auto-refresh every 30 seconds
loadDepartures();
setInterval(loadDepartures, 30000);

// ---------------------------------------------------------------------------
// ROUTING — plan a trip from user's current location to Metro Pizza
// ---------------------------------------------------------------------------

/** Destination: Metropolia Bulevardi */
const DESTINATION = { lat: 60.1650, lon: 24.9340, name: 'Metro Pizza' };

/**
 * Query HSL routing API for itineraries from origin to destination
 * @param {{ lat: number, lon: number }} from
 * @param {{ lat: number, lon: number }} to
 * @returns {Promise<Object>}
 */
async function fetchRoute(from, to) {
  const query = `
    {
      plan(
        from: { lat: ${from.lat}, lon: ${from.lon} }
        to:   { lat: ${to.lat},   lon: ${to.lon}   }
        numItineraries: 3
        transportModes: [
          { mode: BUS },
          { mode: TRAM },
          { mode: SUBWAY },
          { mode: RAIL },
          { mode: WALK }
        ]
      ) {
        itineraries {
          duration
          walkDistance
          legs {
            mode
            duration
            distance
            from { name lat lon }
            to   { name lat lon }
            route { shortName longName }
            startTime
            endTime
          }
        }
      }
    }
  `;

  const res = await fetch(HSL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`HSL routing error: ${res.status}`);
  return res.json();
}

/**
 * Format duration in seconds to "X min" or "X h Y min"
 * @param {number} secs
 * @returns {string}
 */
function formatDuration(secs) {
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/**
 * Format Unix timestamp (ms) to HH:MM
 * @param {number} ms
 * @returns {string}
 */
function formatTime(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

/** Mode labels and colors */
const MODE_LABEL = { WALK: 'Kävely', BUS: 'Bussi', TRAM: 'Ratikka', SUBWAY: 'Metro', RAIL: 'Juna', FERRY: 'Lautta' };
const MODE_COLOR = { WALK: '#888780', BUS: '#007ac9', TRAM: '#009950', SUBWAY: '#ff5a1e', RAIL: '#8c4799', FERRY: '#007ac9' };

/**
 * Render one itinerary card
 * @param {Object} itin - itinerary from API
 * @param {number} index
 * @returns {string} HTML
 */
function renderItinerary(itin, index) {
  const totalMins  = Math.round(itin.duration / 60);
  const startTime  = formatTime(itin.legs[0].startTime);
  const endTime    = formatTime(itin.legs[itin.legs.length - 1].endTime);
  const walkKm     = (itin.walkDistance / 1000).toFixed(1);

  // Build leg pills
  const legPills = itin.legs.map(leg => {
    const color = MODE_COLOR[leg.mode] || '#888780';
    const label = leg.mode === 'WALK'
      ? `🚶 ${Math.round(leg.duration / 60)} min`
      : `${leg.route?.shortName || MODE_LABEL[leg.mode] || leg.mode}`;
    return `<span style="
      background:${color}22;
      color:${color};
      border:1px;
      font-size:0.72rem;
      font-weight:600;
      padding:0.2rem 0.55rem;
      border-radius:4px;
      white-space:nowrap;
    ">${label}</span>`;
  }).join('<span style="color:var(--text2);font-size:0.8rem">→</span>');

  // Build step-by-step legs
  const steps = itin.legs.map(leg => {
    const color    = MODE_COLOR[leg.mode] || '#888780';
    const modeName = MODE_LABEL[leg.mode] || leg.mode;
    const dur      = formatDuration(leg.duration);

    let detail = '';
    if (leg.mode === 'WALK') {
      detail = `Kävele ${Math.round(leg.distance)} m → ${leg.to.name}`;
    } else {
      const route = leg.route?.shortName ? `(${leg.route.shortName})` : '';
      detail = `${modeName} ${route} → ${leg.to.name}`;
    }

    return `
      <div style="display:flex;gap:0.6rem;align-items:flex-start;padding:0.45rem 0;border-bottom:1px solid var(--border);">
        <span style="
          background:${color}22;color:${color};
          font-size:0.68rem;font-weight:700;
          padding:0.15rem 0.45rem;border-radius:3px;
          flex-shrink:0;margin-top:2px;
        ">${modeName}</span>
        <span style="flex:1;font-size:0.83rem;color:var(--text2)">${detail}</span>
        <span style="font-size:0.78rem;color:var(--text2);white-space:nowrap">${dur}</span>
      </div>
    `;
  }).join('');

  return `
    <div style="
      background:var(--bg2);
      border:1px solid var(--border);
      border-radius:var(--radius);
      overflow:hidden;
      margin-bottom:0.75rem;
    ">
      <!-- Header -->
      <div style="
        display:flex;align-items:center;gap:1rem;
        padding:0.85rem 1rem;
        border-bottom:1px solid var(--border);
        flex-wrap:wrap;gap:0.5rem;
      ">
        <div style="flex:1">
          <div style="font-size:1.1rem;font-weight:600">${totalMins} min</div>
          <div style="font-size:0.75rem;color:var(--text2)">${startTime} – ${endTime} &nbsp;·&nbsp; Kävely ${walkKm} km</div>
        </div>
        <div style="display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap">
          ${legPills}
        </div>
      </div>
      <!-- Steps -->
      <div style="padding:0.25rem 1rem 0.5rem">
        ${steps}
      </div>
    </div>
  `;
}

/**
 * Get user's geolocation and fetch route, then render results
 */
function planRoute() {
  const container = document.getElementById('route-result');
  const btn       = document.getElementById('routeBtn');

  // Show loading
  btn.disabled = true;
  btn.textContent = 'Haetaan sijaintiasi...';
  container.innerHTML = `
    <div class="loading-state" style="margin-top:0.5rem">
      <div class="skeleton" style="height:90px"></div>
      <div class="skeleton" style="height:90px"></div>
      <div class="skeleton" style="height:90px"></div>
    </div>
  `;

  if (!navigator.geolocation) {
    container.innerHTML = `<div class="error-state">Selaimesi ei tue paikannusta.</div>`;
    btn.disabled = false;
    btn.textContent = '📍 Näytä reitti sijainnistani';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const from = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      btn.textContent = 'Lasketaan reitti...';

      try {
        const data   = await fetchRoute(from, DESTINATION);
        const itins  = data?.data?.plan?.itineraries || [];

        if (itins.length === 0) {
          container.innerHTML = `<div class="error-state">Reittejä ei löytynyt.</div>`;
        } else {
          container.innerHTML = itins.map((it, i) => renderItinerary(it, i)).join('');
        }
      } catch (err) {
        container.innerHTML = `<div class="error-state">⚠️ Reittihaku epäonnistui. Yritä uudelleen.</div>`;
      } finally {
        btn.disabled = false;
        btn.textContent = '📍 Päivitä reitti';
      }
    },
    (err) => {
      container.innerHTML = `<div class="error-state">⚠️ Paikannus estetty. Salli sijainti selaimessa ja yritä uudelleen.</div>`;
      btn.disabled = false;
      btn.textContent = '📍 Näytä reitti sijainnistani';
    },
    { timeout: 10000, enableHighAccuracy: false }
  );
}
