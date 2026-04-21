/**
 * hsl.js
 * Entry point for HSL routing on sijainti.html.
 * Imports routeService.js and uiRenderer.js.
 */

import { fetchRoute, getCurrentPosition, DESTINATION } from './hsl/routeService.js';
import { showSpinner, showNoRoutes, showError, showItineraries } from './hsl/uiRenderer.js';

const btn    = document.getElementById('routeBtn');
const result = document.getElementById('route-result');

async function planRoute() {
  if (!btn || !result) return;

  btn.disabled    = true;
  btn.textContent = 'Haetaan…';
  showSpinner(result);

  try {
    const from        = await getCurrentPosition();
    const itineraries = await fetchRoute(from, DESTINATION);

    if (!itineraries.length) {
      showNoRoutes(result);
      return;
    }

    showItineraries(result, itineraries);

  } catch (err) {
    console.error('[HSL]', err);
    showError(result, err.message || 'Reittihaku epäonnistui.');
  } finally {
    btn.disabled    = false;
    btn.textContent = '📍 Näytä reitti sijainnistani';
  }
}

btn?.addEventListener('click', planRoute);
