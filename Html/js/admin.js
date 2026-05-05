/**
 * admin.js (frontend)
 * Hallintapaneeli – Metro Pizza
 *
 * Toiminnot:
 *  - Tarkistaa admin-kirjautumisen (JWT)
 *  - Hakee tilaukset GET /api/admin/orders
 *  - Renderöi tilaukset #orders-tbody -taulukkoon
 *  - Mahdollistaa tilauksen tilan päivityksen PUT /api/admin/orders/:id
 *  - Päivittää stat-kortit (tilaukset, odottavat, myynti)
 */

const API = "http://10.120.32.74:3001/api/admin";
// ─── Auth-tarkistus ───────────────────────────────────────────────────────────
async function haeStats() {
  const token = getToken();

  const res = await fetch(`${API}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return;

  const stats = await res.json();

  const usersEl = document.getElementById("users-count");
  if (usersEl) usersEl.textContent = stats.usersCount;
}

function getToken() {
  return localStorage.getItem("token");
}

function getKayttaja() {
  try {
    return JSON.parse(localStorage.getItem("kayttaja"));
  } catch {
    return null;
  }
}

(function tarkistaAdmin() {
  const token = getToken();
  const kayttaja = getKayttaja();
  if (!token || !kayttaja || kayttaja.rooli !== "admin") {
    alert("Pääsy kielletty. Kirjaudu ylläpitäjänä.");
    window.location.href = "kirjaudu.html";
  }
})();

// ─── Apufunktiot ─────────────────────────────────────────────────────────────

function formatPvm(isoStr) {
  if (!isoStr) return "–";
  const d = new Date(isoStr);
  return d.toLocaleString("fi-FI", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHinta(val) {
  if (val === null || val === undefined) return "–";
  return parseFloat(val).toFixed(2).replace(".", ",") + " €";
}

/** Palauttaa tilalle CSS-luokan */
function tilaClass(tila) {
  const map = {
    odottaa: "new",
    valmistetaan: "pending",
    valmis: "pending",
    noudettu: "done",
    peruutettu: "done",
  };
  return map[tila] || "new";
}

/** Palauttaa tilalle suomenkielisen tekstin */
function tilaTeksti(tila) {
  const map = {
    odottaa: "Uusi",
    valmistetaan: "Valmisteilla",
    valmis: "Valmis",
    noudettu: "Noudettu",
    peruutettu: "Peruutettu",
  };
  return map[tila] || tila;
}

// ─── Tilausten haku ───────────────────────────────────────────────────────────

async function haeTilaukset() {
  const token = getToken();
  try {
    const res = await fetch(`${API}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      alert("Istunto vanhentunut. Kirjaudu uudelleen.");
      window.location.href = "kirjaudu.html";
      return [];
    }

    if (!res.ok) throw new Error("Haku epäonnistui");
    return await res.json();
  } catch (err) {
    console.error("Tilausten haku epäonnistui:", err);
    naytaVirhe("Tilausten haku epäonnistui. Tarkista yhteys palvelimeen.");
    return [];
  }
}

// ─── Tilauksen tilan päivitys ─────────────────────────────────────────────────

async function paivitaTila(tilausId, uusiTila, riviEl) {
  const token = getToken();
  try {
    const res = await fetch(`${API}/orders/${tilausId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tila: uusiTila }),
    });

    if (!res.ok) throw new Error("Päivitys epäonnistui");

    // Päivitä rivi UI:ssa
    const tilaCell = riviEl.querySelector(".order-tila-cell");
    if (tilaCell) {
      tilaCell.innerHTML = `<span class="status ${tilaClass(uusiTila)}">${tilaTeksti(uusiTila)}</span>`;
    }
  } catch (err) {
    console.error(err);
    alert("Tilan päivitys epäonnistui.");
  }
}

// ─── Renderöinti ──────────────────────────────────────────────────────────────

function renderTilaukset(tilaukset) {
  const tbody = document.getElementById("orders-tbody");
  if (!tbody) {
    console.warn("orders-tbody ei löydy sivulta.");
    return;
  }

  if (tilaukset.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:var(--text2);padding:2rem">
          Ei tilauksia
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = "";

  tilaukset.forEach((t) => {
    const tr = document.createElement("tr");
    tr.dataset.tilausId = t.tilaus_id;

    // Tilavalinnat dropdown
    const tilaVaihtoehdot = [
      "odottaa",
      "valmistetaan",
      "valmis",
      "noudettu",
      "peruutettu",
    ]
      .map(
        (v) =>
          `<option value="${v}" ${v === t.tila ? "selected" : ""}>${tilaTeksti(v)}</option>`,
      )
      .join("");

    tr.innerHTML = `
      <td style="color:var(--text2)">#${t.tilaus_id}</td>
      <td>${t.asiakas || "–"}</td>
      <td style="font-size:0.85rem;color:var(--text2)">${t.tuotteet || "–"}</td>
      <td style="color:var(--text2)">${formatPvm(t.paivamaara)}</td>
      <td>${formatHinta(t.kokonaishinta)}</td>
      <td class="order-tila-cell">
        <select class="tila-select" data-id="${t.tilaus_id}" style="
          background:var(--bg3,#222);
          border:1px solid var(--border,#333);
          color:var(--text,#fff);
          border-radius:6px;
          padding:0.3rem 0.5rem;
          font-size:0.82rem;
          cursor:pointer;
          font-family:'DM Sans',sans-serif;
        ">
          ${tilaVaihtoehdot}
        </select>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Sido tila-muutokset
  tbody.querySelectorAll(".tila-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      const tilausId = parseInt(e.target.dataset.id);
      const uusiTila = e.target.value;
      const rivi = e.target.closest("tr");
      paivitaTila(tilausId, uusiTila, rivi);
    });
  });
}

// ─── Stat-korttien päivitys ────────────────────────────────────────────────────

function paivitaStats(tilaukset) {
  const tanaan = new Date().toDateString();

  const tanaanTilaukset = tilaukset.filter(
    (t) => new Date(t.paivamaara).toDateString() === tanaan,
  );

  const odottavat = tilaukset.filter(
    (t) => t.tila === "odottaa" || t.tila === "valmistetaan",
  );

  const myyntiTanaan = tanaanTilaukset
    .filter((t) => t.tila !== "peruutettu")
    .reduce((s, t) => s + parseFloat(t.kokonaishinta || 0), 0);

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setVal("orders-today", tanaanTilaukset.length);
  setVal("orders-pending", odottavat.length);
  setVal("sales-today", myyntiTanaan.toFixed(2).replace(".", ",") + " €");
}

// ─── Virheviesti ─────────────────────────────────────────────────────────────

function naytaVirhe(teksti) {
  const tbody = document.getElementById("orders-tbody");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:var(--accent,#e8471a);padding:2rem">
          ⚠️ ${teksti}
        </td>
      </tr>`;
  }
}

// ─── Kirjaudu ulos ────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Kirjaudu ulos -nappi
  const logoutBtn = document.querySelector(".btn-outline");
  if (logoutBtn && logoutBtn.textContent.includes("Kirjaudu ulos")) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("kayttaja");
      window.location.href = "kirjaudu.html";
    });
  }

  // Näytä kirjautuneen käyttäjän nimi
  const kayttaja = getKayttaja();
  const adminNimiEl = document.querySelector("[data-admin-name], .admin-email");
  if (adminNimiEl && kayttaja) adminNimiEl.textContent = kayttaja.nimi;
});

// ─── Pääkäynnistys ────────────────────────────────────────────────────────────

async function alusta() {
  const tilaukset = await haeTilaukset();
  renderTilaukset(tilaukset);
  paivitaStats(tilaukset);
  await haeStats();
  await haeRuokalista();

  setInterval(async () => {
    const paivitetyt = await haeTilaukset();
    renderTilaukset(paivitetyt);
    paivitaStats(paivitetyt);
    await haeStats();
  }, 30_000);
}

document.addEventListener("DOMContentLoaded", alusta);

// ─── Uuden tuotteen lisääminen ───────────────────────────────────────────────

async function lisaaTuote() {
  const nimi = document.getElementById("new-nimi").value;
  const kuvaus = document.getElementById("new-kuvaus").value;
  const hinta = document.getElementById("new-hinta").value;
  const kategoria = document.getElementById("new-kategoria").value;
  const viikonpaiva = document.getElementById("new-viikonpaiva").value;

  // Kerätään valitut erityisruokavaliot taulukkoon
  const dietit = [];
  if (document.getElementById("diet-kasvis").checked) dietit.push("kasvis");
  if (document.getElementById("diet-gluteeniton").checked)
    dietit.push("gluteeniton");
  if (document.getElementById("diet-maitoa").checked) dietit.push("maitoa");

  const token = getToken();
  const errorEl = document.getElementById("add-modal-error");

  try {
    const res = await fetch(`${API}/menu`, {
      // POST http://10.120.32.74:3001/api/admin/menu
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nimi,
        kuvaus, // HUOM: Tietokannassa on kuvaus-sarake
        hinta: parseFloat(hinta),
        kategoria,
        viikonpaiva, // Backend odottaa tätä dokumentaation mukaan
        erityisruokavaliot: dietit.join(", "), // Lähetetään merkkijonona
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Tuotteen lisäys epäonnistui");
    }

    alert("Tuote lisätty onnistuneesti!");
    document.getElementById("add-modal").classList.remove("open");
    await haeRuokalista();
  } catch (err) {
    console.error("Virhe tuotetta lisättäessä:", err);
    errorEl.textContent = err.message;
    errorEl.style.display = "block";
  }
}

// Sido funktio tallennusnappiin, kun DOM on ladattu
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("save-product-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", lisaaTuote);
  }
});

// ─── Ruokalistan haku ja renderöinti ──────────────────────────────────────────

async function haeRuokalista() {
  try {
    const res = await fetch("http://localhost:3001/api/menu"); // Hae koko ruokalista[cite: 5]
    if (!res.ok) throw new Error("Ruokalistan haku epäonnistui");
    const data = await res.json();

    // API palauttaa datan kategorioittain, yhdistetään ne yhdeksi listaksi[cite: 5]
    const tuotteet = Object.values(data).flat();
    renderRuokalista(tuotteet);
  } catch (err) {
    console.error(err);
  }
}

function renderRuokalista(tuotteet) {
  const tbody = document.getElementById("menu-tbody");
  if (!tbody) return;

  tbody.innerHTML = ""; // Tyhjennetään staattiset esimerkkirivit

  tuotteet.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <strong>${t.nimi}</strong><br>
        <span style="font-size:0.8rem;color:var(--text2)">${t.kuvaus || "Ei kuvausta"}</span>
      </td>
      <td style="color:var(--text2)">${t.kategoria}</td>
      <td>${formatHinta(t.hinta)}</td>
      <td>${t.erityisruokavaliot || "–"}</td>
      <td>
        <button class="icon-btn">Muokkaa</button>
        <button class="icon-btn" style="color:var(--accent);margin-left:0.4rem" onclick="poistaTuote(${t.tuote_id})">Poista</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
