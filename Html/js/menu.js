/**
 * menu.js
 * Dynaaminen ruokalista Metro Pizza -sovellukselle.
 *
 * Hakee lounaslistan backendistä GET /api/menu/lounas
 * ja renderöi sen #dynamic-menu -konttiin.
 * Käyttää samoja CSS-luokkia kuin alkuperäinen Ruokalista.html,
 * joten cart.js toimii muuttumattomana.
 */

const API_BASE = "http://localhost:3001/api";

// Viikonpäivien järjestys ja suomenkieliset nimet
const PAIVAT = [
  { avain: "maanantai", nimi: "Maanantai" },
  { avain: "tiistai", nimi: "Tiistai" },
  { avain: "keskiviikko", nimi: "Keskiviikko" },
  { avain: "torstai", nimi: "Torstai" },
  { avain: "perjantai", nimi: "Perjantai" },
];
let nykyinenLounaslista = {};
let aktiivinenSuodatin = "kaikki";
// Kartoitetaan suomenkieliset viikonpäivät JS:n getDay()-indekseihin
const TANAAN_INDEKSI = new Date().getDay(); // 0=su, 1=ma, 2=ti, ...
const PAIVA_INDEKSIT = {
  maanantai: 1,
  tiistai: 2,
  keskiviikko: 3,
  torstai: 4,
  perjantai: 5,
};

// Erityisruokavaliot → CSS-luokka ja lyhenne
const RUOKAVALIOT = {
  kasvis: { luokka: "veg", teksti: "Veg" },
  gluteeniton: { luokka: "glu", teksti: "Glu-free" },
  maitoa: { luokka: "lac", teksti: "Maitoa" },
  laktoositon: { luokka: "lac", teksti: "Laktoositon" },
};

/**
 * Muodostaa diet-tagit erityisruokavaliot-merkkijonosta.
 * @param {string|null} erityisruokavaliot – pilkulla eroteltu lista, esim. "kasvis,maitoa"
 * @returns {string} HTML-merkkijono diet-tageista
 */
function renderDietTagit(erityisruokavaliot) {
  if (!erityisruokavaliot) return "";
  return erityisruokavaliot
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter((r) => RUOKAVALIOT[r])
    .map((r) => {
      const { luokka, teksti } = RUOKAVALIOT[r];
      return `<span class="diet-tag ${luokka}">${teksti}</span>`;
    })
    .join("");
}
function tuoteSopiiSuodattimeen(tuote) {
  if (aktiivinenSuodatin === "kaikki") return true;

  const ruokavaliot = String(tuote.erityisruokavaliot || "")
    .toLowerCase()
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  if (aktiivinenSuodatin === "laktoositon") {
    return !ruokavaliot.includes("maitoa");
  }

  return ruokavaliot.includes(aktiivinenSuodatin);
}
/**
 * Muotoilee hinnan suomalaiseen tapaan: "10,90 €"
 * @param {number|string} hinta
 * @returns {string}
 */
function formatHinta(hinta) {
  return parseFloat(hinta).toFixed(2).replace(".", ",") + " €";
}

/**
 * Renderöi yhden tuotteen .menu-item -elementtinä.
 * Lisää kaikki data-attribuutit cart.js:ää varten.
 * @param {Object} tuote
 * @returns {HTMLElement}
 */
function renderTuote(tuote) {
  const item = document.createElement("div");
  item.className = "menu-item";
  item.dataset.tuoteId = tuote.tuote_id;
  item.dataset.name = tuote.nimi;
  item.dataset.price = tuote.hinta;

  const dietTagitHTML = renderDietTagit(tuote.erityisruokavaliot);

  item.innerHTML = `
    <div class="menu-item-info">
      <h4>${escapeHtml(tuote.nimi)}</h4>
      <p>${escapeHtml(tuote.kuvaus || "")}</p>
      ${dietTagitHTML ? `<div class="diet-tags">${dietTagitHTML}</div>` : ""}
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.75rem">
      <div class="menu-item-price">${formatHinta(tuote.hinta)}</div>
      <button
        class="add-btn"
        aria-label="Lisää koriin"
        data-tuote-id="${tuote.tuote_id}"
        data-name="${escapeHtml(tuote.nimi)}"
        data-price="${tuote.hinta}"
      >+</button>
    </div>
  `;
  return item;
}

/**
 * Renderöi yhden päiväblokin.
 * @param {Object} paivaInfo – { avain, nimi }
 * @param {Array}  tuotteet  – tuotteet tälle päivälle
 * @param {boolean} onTanaan – onko kyseessä tämä päivä
 * @returns {HTMLElement}
 */
function renderPaivaBlokki(paivaInfo, tuotteet, onTanaan) {
  const block = document.createElement("div");
  block.className = "day-block" + (onTanaan ? " today" : "");

  const tanaan = onTanaan ? '<span class="today-badge">Tänään</span>' : "";

  block.innerHTML = `
    <div class="day-header">
      <span class="day-name">${paivaInfo.nimi}</span>
      ${tanaan}
    </div>
    <div class="menu-grid"></div>
  `;

  const grid = block.querySelector(".menu-grid");

  if (!tuotteet || tuotteet.length === 0) {
    grid.innerHTML =
      '<p style="color:var(--text2);font-size:0.9rem">Ei lounaita tälle päivälle.</p>';
  } else {
    tuotteet.forEach((tuote) => grid.appendChild(renderTuote(tuote)));
  }

  return block;
}

/**
 * Pienet HTML-turvatoimenpiteet (ei korvaa server-side sanitointia).
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Näyttää virheviestin #dynamic-menu -kontissa.
 */
function naytaVirhe(kontti, viesti) {
  kontti.innerHTML = `
    <div style="
      padding: 2rem;
      border: 1px solid rgba(232,71,42,0.3);
      border-radius: 12px;
      background: rgba(232,71,42,0.08);
      color: var(--accent, #e8471a);
      text-align: center;
    ">
      <p style="font-size:1rem;margin:0">⚠️ ${escapeHtml(viesti)}</p>
      <p style="font-size:0.85rem;color:var(--text2);margin-top:0.5rem">
        Tarkista, että backend on käynnissä osoitteessa ${API_BASE}
      </p>
    </div>
  `;
}

/**
 * Pääfunktio: hakee lounaslistan ja renderöi sen.
 */
function renderoiMenu() {
  const kontti = document.getElementById("dynamic-menu");
  if (!kontti) return;

  kontti.innerHTML = "";

  PAIVAT.forEach((paivaInfo) => {
    const tuotteet = (nykyinenLounaslista[paivaInfo.avain] || []).filter(
      tuoteSopiiSuodattimeen,
    );

    const onTanaan = PAIVA_INDEKSIT[paivaInfo.avain] === TANAAN_INDEKSI;
    const blokki = renderPaivaBlokki(paivaInfo, tuotteet, onTanaan);
    kontti.appendChild(blokki);
  });

  document.dispatchEvent(new Event("menuRendered"));
}

/**
 * Pääfunktio: hakee lounaslistan ja renderöi sen.
 */
async function lataaJaRenderoi() {
  const kontti = document.getElementById("dynamic-menu");
  if (!kontti) {
    console.error("menu.js: #dynamic-menu -elementtiä ei löydy sivulta.");
    return;
  }

  kontti.innerHTML = `
    <p style="color:var(--text2);text-align:center;padding:2rem 0">
      Ladataan ruokalistaa…
    </p>
  `;

  try {
    const res = await fetch(`${API_BASE}/menu/lounas`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    nykyinenLounaslista = await res.json();
    renderoiMenu();
  } catch (err) {
    console.error("menu.js: Lounaslistan haku epäonnistui:", err);
    naytaVirhe(kontti, "Ruokalistan lataaminen epäonnistui.");
  }
}

function alustaSuodatus() {
  document.querySelectorAll(".filter-row .tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-row .tab")
        .forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");
      aktiivinenSuodatin = btn.dataset.filter || "kaikki";

      renderoiMenu();
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    alustaSuodatus();
    lataaJaRenderoi();
  });
} else {
  alustaSuodatus();
  lataaJaRenderoi();
}
