/**
 * admin.js (frontend)
 * Hallintapaneeli – Metro Pizza
 *
 * Toiminnot:
 *  - Tarkistaa admin-kirjautumisen JWT-tokenilla
 *  - Hakee ja renderöi tilaukset
 *  - Mahdollistaa tilauksen tilan päivityksen
 *  - Hakee ja renderöi ruokalistan tuotteet
 *  - Mahdollistaa tuotteen lisäämisen ja poistamisen
 *  - Hakee ja renderöi käyttäjät
 *  - Mahdollistaa käyttäjän roolin vaihtamisen
 *  - Päivittää admin-paneelin tilastot
 */

const API = "https://webprojekti-production.up.railway.app/api/admin";
const PUBLIC_API = "https://webprojekti-production.up.railway.app/api";

let tuotteetCache = [];
let muokattavaTuoteId = null;
// ─── Auth-apufunktiot ────────────────────────────────────────────────────────

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

// ─── Yleiset apufunktiot ─────────────────────────────────────────────────────

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
  if (val === null || val === undefined || val === "") return "–";

  return Number(val).toFixed(2).replace(".", ",") + " €";
}

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

function naytaVirhe(teksti) {
  const tbody = document.getElementById("orders-tbody");

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:var(--accent,#e8471a);padding:2rem">
          ⚠️ ${teksti}
        </td>
      </tr>
    `;
  }
}

// ─── Tilastot ────────────────────────────────────────────────────────────────

async function haeStats() {
  const token = getToken();

  try {
    const res = await fetch(`${API}/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return;

    const stats = await res.json();

    const usersEl = document.getElementById("users-count");
    if (usersEl) usersEl.textContent = stats.usersCount;
  } catch (err) {
    console.error("Tilastojen haku epäonnistui:", err);
  }
}

// ─── Tilausten haku ──────────────────────────────────────────────────────────

async function haeTilaukset() {
  const token = getToken();

  try {
    const res = await fetch(`${API}/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      alert("Istunto vanhentunut. Kirjaudu uudelleen.");
      window.location.href = "kirjaudu.html";
      return [];
    }

    if (!res.ok) throw new Error("Tilausten haku epäonnistui");

    return await res.json();
  } catch (err) {
    console.error("Tilausten haku epäonnistui:", err);
    naytaVirhe("Tilausten haku epäonnistui. Tarkista yhteys palvelimeen.");
    return [];
  }
}

// ─── Tilauksen tilan päivitys ────────────────────────────────────────────────

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

    const tilaCell = riviEl.querySelector(".order-tila-cell");

    if (tilaCell) {
      tilaCell.innerHTML = `
        <span class="status ${tilaClass(uusiTila)}">
          ${tilaTeksti(uusiTila)}
        </span>
      `;
    }
  } catch (err) {
    console.error(err);
    alert("Tilan päivitys epäonnistui.");
  }
}

// ─── Tilausten renderöinti ───────────────────────────────────────────────────

function renderTilaukset(tilaukset) {
  const tbody = document.getElementById("orders-tbody");

  if (!tbody) {
    console.warn("orders-tbody ei löydy sivulta.");
    return;
  }

  if (!tilaukset.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:var(--text2);padding:2rem">
          Ei tilauksia
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";

  tilaukset.forEach((t) => {
    const tr = document.createElement("tr");
    tr.dataset.tilausId = t.tilaus_id;

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
      <td style="font-size:0.85rem;color:var(--text2)">
        ${t.tuotteet || "–"}
      </td>
      <td style="color:var(--text2)">
        ${formatPvm(t.paivamaara)}
      </td>
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

  tbody.querySelectorAll(".tila-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      const tilausId = Number(e.target.dataset.id);
      const uusiTila = e.target.value;
      const rivi = e.target.closest("tr");

      paivitaTila(tilausId, uusiTila, rivi);
    });
  });
}

// ─── Stat-korttien päivitys ──────────────────────────────────────────────────

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
    .reduce((summa, t) => summa + Number(t.kokonaishinta || 0), 0);

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setVal("orders-today", tanaanTilaukset.length);
  setVal("orders-pending", odottavat.length);
  setVal("sales-today", myyntiTanaan.toFixed(2).replace(".", ",") + " €");
}

// ─── Ruokalistan haku ────────────────────────────────────────────────────────

async function haeRuokalista() {
  try {
    const res = await fetch(`${PUBLIC_API}/menu`);

    if (!res.ok) throw new Error("Ruokalistan haku epäonnistui");

    const data = await res.json();

    // /api/menu palauttaa yleensä taulukon.
    // Tämä toimii myös, jos data joskus palautuisi objektina.
    const tuotteet = Array.isArray(data) ? data : Object.values(data).flat();

    tuotteetCache = tuotteet;
    renderRuokalista(tuotteet);
  } catch (err) {
    console.error("Ruokalistan haku epäonnistui:", err);
  }
}

// ─── Ruokalistan renderöinti ─────────────────────────────────────────────────

function renderRuokalista(tuotteet) {
  const tbody = document.getElementById("menu-tbody");

  if (!tbody) return;

  if (!tuotteet.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:var(--text2);padding:2rem">
          Ei tuotteita
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";

  tuotteet.forEach((t) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <strong>${t.nimi}</strong><br>
        <span style="font-size:0.8rem;color:var(--text2)">
          ${t.kuvaus || "Ei kuvausta"}
        </span>
      </td>

      <td style="color:var(--text2)">
        ${t.kategoria || "–"}
      </td>

      <td>
        ${formatHinta(t.hinta)}
      </td>

      <td>
        ${t.erityisruokavaliot || "–"}
      </td>

      <td>
        <button class="icon-btn edit-product-btn" data-id="${t.tuote_id}">
          Muokkaa
        </button>

        <button
          class="icon-btn delete-product-btn"
          data-id="${t.tuote_id}"
          style="color:var(--accent);margin-left:0.4rem"
        >
          Poista
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".delete-product-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      poistaTuote(btn.dataset.id);
    });
  });

  tbody.querySelectorAll(".edit-product-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      avaaMuokkaaTuoteModal(btn.dataset.id);
    });
  });
}

// ─── Uuden tuotteen lisääminen ───────────────────────────────────────────────
async function tallennaTuote() {
  const nimi = document.getElementById("new-nimi")?.value?.trim();
  const kuvaus = document.getElementById("new-kuvaus")?.value?.trim();
  const hinta = document.getElementById("new-hinta")?.value;
  const kategoria = document.getElementById("new-kategoria")?.value;
  const viikonpaiva = document.getElementById("new-viikonpaiva")?.value;
  const errorEl = document.getElementById("add-modal-error");

  const dietit = [];

  if (document.getElementById("diet-kasvis")?.checked) {
    dietit.push("kasvis");
  }

  if (document.getElementById("diet-gluteeniton")?.checked) {
    dietit.push("gluteeniton");
  }

  if (document.getElementById("diet-maitoa")?.checked) {
    dietit.push("maitoa");
  }

  if (!nimi || !hinta || !kategoria) {
    if (errorEl) {
      errorEl.textContent = "Nimi, hinta ja kategoria ovat pakollisia.";
      errorEl.style.display = "block";
    }
    return;
  }

  const token = getToken();

  const payload = {
    nimi,
    kuvaus,
    hinta: Number(hinta),
    kategoria,
    viikonpaiva,
    erityisruokavaliot: dietit.join(","),
  };

  const url = muokattavaTuoteId
    ? `${API}/menu/${muokattavaTuoteId}`
    : `${API}/menu`;

  const method = muokattavaTuoteId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || data.message || "Tuotteen tallennus epäonnistui",
      );
    }

    alert(
      muokattavaTuoteId
        ? "Tuote päivitetty onnistuneesti!"
        : "Tuote lisätty onnistuneesti!",
    );

    suljeTuoteModal();
    await haeRuokalista();
  } catch (err) {
    console.error("Virhe tuotetta tallennettaessa:", err);

    if (errorEl) {
      errorEl.textContent = err.message;
      errorEl.style.display = "block";
    }
  }
}
function tyhjennaTuoteLomake() {
  document.getElementById("new-nimi").value = "";
  document.getElementById("new-kuvaus").value = "";
  document.getElementById("new-hinta").value = "";
  document.getElementById("new-kategoria").value = "lounas";
  document.getElementById("new-viikonpaiva").value = "";

  document.getElementById("diet-kasvis").checked = false;
  document.getElementById("diet-gluteeniton").checked = false;
  document.getElementById("diet-maitoa").checked = false;

  const errorEl = document.getElementById("add-modal-error");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.style.display = "none";
  }
}

function avaaUusiTuoteModal() {
  muokattavaTuoteId = null;
  tyhjennaTuoteLomake();

  const title = document.getElementById("add-modal-title");
  if (title) title.textContent = "Lisää uusi tuote";

  const saveBtn = document.getElementById("save-product-btn");
  if (saveBtn) saveBtn.textContent = "Tallenna tuote";

  document.getElementById("add-modal")?.classList.add("open");
}

function avaaMuokkaaTuoteModal(tuoteId) {
  const tuote = tuotteetCache.find(
    (t) => String(t.tuote_id) === String(tuoteId),
  );

  if (!tuote) {
    alert("Tuotetta ei löydy.");
    return;
  }

  muokattavaTuoteId = tuote.tuote_id;

  document.getElementById("new-nimi").value = tuote.nimi || "";
  document.getElementById("new-kuvaus").value = tuote.kuvaus || "";
  document.getElementById("new-hinta").value = tuote.hinta || "";
  document.getElementById("new-kategoria").value = tuote.kategoria || "lounas";
  document.getElementById("new-viikonpaiva").value = tuote.viikonpaiva || "";

  const dietit = String(tuote.erityisruokavaliot || "")
    .toLowerCase()
    .split(",")
    .map((d) => d.trim());

  document.getElementById("diet-kasvis").checked = dietit.includes("kasvis");
  document.getElementById("diet-gluteeniton").checked =
    dietit.includes("gluteeniton");
  document.getElementById("diet-maitoa").checked = dietit.includes("maitoa");

  const errorEl = document.getElementById("add-modal-error");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.style.display = "none";
  }

  const title = document.getElementById("add-modal-title");
  if (title) title.textContent = "Muokkaa tuotetta";

  const saveBtn = document.getElementById("save-product-btn");
  if (saveBtn) saveBtn.textContent = "Päivitä tuote";

  document.getElementById("add-modal")?.classList.add("open");
}

function suljeTuoteModal() {
  document.getElementById("add-modal")?.classList.remove("open");
  muokattavaTuoteId = null;
}
// ─── Tuotteen poisto ─────────────────────────────────────────────────────────

async function poistaTuote(tuoteId) {
  const token = getToken();

  const ok = confirm("Haluatko varmasti poistaa tämän tuotteen?");
  if (!ok) return;

  try {
    const res = await fetch(`${API}/menu/${tuoteId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Tuotteen poisto epäonnistui.");
      return;
    }

    await haeRuokalista();
  } catch (err) {
    console.error("Tuotteen poisto epäonnistui:", err);
    alert("Palvelimeen ei saatu yhteyttä.");
  }
}

// ─── Käyttäjien haku ─────────────────────────────────────────────────────────

async function haeKayttajat() {
  const token = getToken();

  try {
    const res = await fetch(`${API}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Käyttäjien haku epäonnistui");
    }

    const kayttajat = await res.json();

    renderKayttajat(kayttajat);
  } catch (err) {
    console.error("Käyttäjien haku epäonnistui:", err);

    const tbody = document.getElementById("users-tbody");

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:var(--accent);padding:2rem">
            Käyttäjien haku epäonnistui
          </td>
        </tr>
      `;
    }
  }
}

// ─── Käyttäjien renderöinti ──────────────────────────────────────────────────

function renderKayttajat(kayttajat) {
  const tbody = document.getElementById("users-tbody");

  if (!tbody) return;

  if (!kayttajat.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:var(--text2);padding:2rem">
          Ei käyttäjiä
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = kayttajat
    .map(
      (k) => `
        <tr>
          <td style="color:var(--text2)">#${k.kayttaja_id}</td>
          <td>${k.nimi || "–"}</td>
          <td style="color:var(--text2)">${k.sahkoposti}</td>
          <td style="color:var(--text2)">${k.opiskelijanumero || "–"}</td>
          <td>
            <select class="role-select" data-id="${k.kayttaja_id}">
              <option value="opiskelija" ${k.rooli === "opiskelija" ? "selected" : ""}>
                Opiskelija
              </option>
              <option value="admin" ${k.rooli === "admin" ? "selected" : ""}>
                Admin
              </option>
            </select>
          </td>
        </tr>
      `,
    )
    .join("");

  tbody.querySelectorAll(".role-select").forEach((select) => {
    select.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const rooli = e.target.value;

      await paivitaKayttajanRooli(id, rooli);
    });
  });
}

// ─── Käyttäjän roolin päivitys ───────────────────────────────────────────────

async function paivitaKayttajanRooli(id, rooli) {
  const token = getToken();

  try {
    const res = await fetch(`${API}/users/${id}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rooli }),
    });

    if (!res.ok) {
      throw new Error("Roolin päivitys epäonnistui");
    }
  } catch (err) {
    console.error("Käyttäjän roolin päivitys epäonnistui:", err);
    alert("Käyttäjän roolin päivitys epäonnistui.");

    await haeKayttajat();
  }
}

// ─── Pääkäynnistys ───────────────────────────────────────────────────────────

async function alusta() {
  const tilaukset = await haeTilaukset();

  renderTilaukset(tilaukset);
  paivitaStats(tilaukset);

  await haeStats();
  await haeKayttajat();
  await haeRuokalista();

  setInterval(async () => {
    const paivitetyt = await haeTilaukset();

    renderTilaukset(paivitetyt);
    paivitaStats(paivitetyt);

    await haeStats();
    await haeKayttajat();
  }, 30_000);
}

// ─── DOM-kuuntelijat ─────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector(".btn-outline");

  if (logoutBtn && logoutBtn.textContent.includes("Kirjaudu ulos")) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("kayttaja");

      window.location.href = "kirjaudu.html";
    });
  }

  const kayttaja = getKayttaja();
  const adminNimiEl = document.querySelector("[data-admin-name], .admin-email");

  if (adminNimiEl && kayttaja) {
    adminNimiEl.textContent = kayttaja.nimi;
  }

  const saveBtn = document.getElementById("save-product-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", tallennaTuote);
  }
  const addProductBtn = document.getElementById("add-product-btn");

  if (addProductBtn) {
    addProductBtn.addEventListener("click", avaaUusiTuoteModal);
  }
  const refreshUsersBtn = document.getElementById("refresh-users-btn");

  if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener("click", haeKayttajat);
  }

  alusta();
});
