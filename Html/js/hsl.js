const DESTINATION = { lat: 60.1650, lon: 24.9340 };

const MODE_LABEL = {
  WALK: 'Kävely',
  BUS: 'Bussi',
  TRAM: 'Ratikka',
  SUBWAY: 'Metro',
  RAIL: 'Juna',
  FERRY: 'Lautta',
};

const MODE_COLOR = {
  WALK: '#888780',
  BUS: '#007ac9',
  TRAM: '#009950',
  SUBWAY: '#ff5a1e',
  RAIL: '#8c4799',
  FERRY: '#007ac9',
};

const ROUTE_QUERY = `
  query RoutePlan($fromLat: Float!, $fromLon: Float!, $toLat: Float!, $toLon: Float!) {
    plan(
      from: { lat: $fromLat, lon: $fromLon }
      to: { lat: $toLat, lon: $toLon }
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
          startTime
          endTime
          from { name }
          to { name }
          route { shortName }
        }
      }
    }
  }
`;

async function fetchRoute(from, to) {
  const res = await fetch('http://localhost:3000/api/route', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: ROUTE_QUERY,
      variables: {
        fromLat: from.lat,
        fromLon: from.lon,
        toLat: to.lat,
        toLon: to.lon
      }
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || `HSL API vastasi: ${res.status}`);
  }

  return data;
}

function formatDuration(secs) {
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function formatTime(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function renderItinerary(itin) {
  const totalMins = Math.round(itin.duration / 60);
  const startTime = formatTime(itin.legs[0].startTime);
  const endTime = formatTime(itin.legs[itin.legs.length - 1].endTime);
  const walkKm = (itin.walkDistance / 1000).toFixed(1);

  const pills = itin.legs.map(leg => {
    const color = MODE_COLOR[leg.mode] || '#888';
    const label = leg.mode === 'WALK'
      ? `🚶 ${Math.round(leg.duration / 60)} min`
      : (leg.route?.shortName || MODE_LABEL[leg.mode] || leg.mode);

    return `<span style="background:${color}25;color:${color};border:1px solid;font-size:0.72rem;font-weight:700;padding:0.2rem 0.55rem;border-radius:4px;white-space:nowrap">${label}</span>`;
  }).join(`<span style="color:var(--text2);font-size:0.75rem;padding:0 2px">›</span>`);

  const steps = itin.legs.map(leg => {
    const color = MODE_COLOR[leg.mode] || '#888';
    const modeName = MODE_LABEL[leg.mode] || leg.mode;
    const dur = formatDuration(leg.duration);
    const detail = leg.mode === 'WALK'
      ? `Kävele ${Math.round(leg.distance)} m kohti ${leg.to.name}`
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
        <div>
          <div style="font-size:1.1rem;font-weight:600">${totalMins} min</div>
          <div style="font-size:0.75rem;color:var(--text2)">${startTime} – ${endTime} · kävely yht. ${walkKm} km</div>
        </div>
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:0.3rem">${pills}</div>
      </div>
      <div style="padding:0.25rem 1rem 0.5rem">${steps}</div>
    </div>`;
}

function showError(msg) {
  return `<div style="background:rgba(232,71,42,0.07);border:1px solid rgba(232,71,42,0.2);border-radius:var(--radius);padding:1rem;color:var(--text2);font-size:0.85rem">⚠️ ${msg}</div>`;
}

function resetBtn(btn) {
  btn.disabled = false;
  btn.textContent = '📍 Näytä reitti sijainnistani';
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Selaimesi ei tue sijainnin hakua.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
      },
      () => reject(new Error('Sijainnin käyttö estettiin tai haku epäonnistui.')),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

async function planRoute() {
  const btn = document.getElementById('routeBtn');
  const result = document.getElementById('route-result');

  if (!btn || !result) return;

  btn.disabled = true;
  btn.textContent = 'Haetaan reittiä...';
  result.innerHTML = '';

  try {
    const from = await getCurrentPosition();
    const data = await fetchRoute(from, DESTINATION);

    const itineraries = data?.data?.plan?.itineraries || [];

    if (!itineraries.length) {
      result.innerHTML = showError('Reittiä ei löytynyt nykyisestä sijainnistasi.');
      return;
    }

    result.innerHTML = itineraries.map(renderItinerary).join('');
  } catch (err) {
    console.error(err);
    result.innerHTML = showError(err.message || 'Reittihaku epäonnistui.');
  } finally {
    resetBtn(btn);
  }
}

const btn = document.getElementById('routeBtn');
if (btn) {
  btn.addEventListener('click', planRoute);
}
