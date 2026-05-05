/**
 * routeService.js
 * Handles geolocation and HSL routing API calls.
 */

const DESTINATION = { lat: 60.165, lon: 24.934 };

/**
 * Send route request to our Express proxy.
 * @param {{ lat: number, lon: number }} from
 * @param {{ lat: number, lon: number }} to
 * @returns {Promise<Object[]>} itineraries sorted fastest first
 */
async function fetchRoute(from, to) {
  const query = `{
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
          startTime
          endTime
          from { name }
          to   { name }
          route { shortName }
        }
      }
    }
  }`;

  const res = await fetch("http://10.120.32.74:3001/api/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Palvelinvirhe: ${res.status}`);

  const itineraries = data?.data?.plan?.itineraries || [];
  return itineraries.sort((a, b) => a.duration - b.duration);
}

/**
 * Get user's current GPS position as a Promise.
 * @returns {Promise<{ lat: number, lon: number }>}
 */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Selaimesi ei tue sijaintia."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () =>
        reject(new Error("Sijainnin käyttö estettiin tai haku epäonnistui.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export { fetchRoute, getCurrentPosition, DESTINATION };
